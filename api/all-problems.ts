import { withAuth, ensureMethod } from "./_lib/http";
import { getDb } from "./_lib/db";

// GET /api/all-problems -> a slim list of every problem across all sheets,
// merged with the caller's done/starred. Powers global search. Cached on the
// client; small enough (~755 rows) to filter instantly in the browser.
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const db = await getDb();

  const [problems, ups] = await Promise.all([
    db
      .collection("problems")
      .find(
        {},
        { projection: { sheetId: 1, sheetLabel: 1, unit: 1, chapter: 1, title: 1, difficulty: 1, order: 1 } },
      )
      .sort({ sheetId: 1, order: 1 })
      .toArray(),
    db
      .collection("userProblems")
      .find({ userId }, { projection: { problemId: 1, done: 1, starred: 1 } })
      .toArray(),
  ]);

  const up = new Map(ups.map((u) => [u.problemId, u]));

  res.json({
    problems: problems.map((p) => {
      const u = up.get(p._id.toString());
      return {
        id: p._id.toString(),
        sheetId: p.sheetId,
        sheetLabel: p.sheetLabel || p.sheetId,
        unit: p.unit,
        chapter: p.chapter,
        title: p.title,
        difficulty: p.difficulty || "",
        done: !!u?.done,
        starred: !!u?.starred,
      };
    }),
  });
});
