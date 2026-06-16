import { ObjectId } from "mongodb";
import { withAuth, ensureMethod } from "./_lib/http";
import { getDb } from "./_lib/db";

// GET /api/revision -> starred problems + problems with a non-empty note,
// across all sheets, for the caller.
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const db = await getDb();

  const userProblems = await db
    .collection("userProblems")
    .find({ userId, $or: [{ starred: true }, { note: { $nin: ["", null] } }] })
    .toArray();

  const ids = userProblems
    .filter((u) => ObjectId.isValid(u.problemId))
    .map((u) => new ObjectId(u.problemId));
  const problems = ids.length
    ? await db.collection("problems").find({ _id: { $in: ids } }).toArray()
    : [];
  const pMap = new Map(problems.map((p) => [p._id.toString(), p]));

  const items = userProblems
    .map((u) => {
      const p = pMap.get(u.problemId);
      if (!p) return null;
      return {
        id: u.problemId,
        sheetId: p.sheetId,
        unit: p.unit,
        chapter: p.chapter,
        title: p.title,
        leetcodeUrl: p.leetcodeUrl || "",
        difficulty: p.difficulty || "",
        done: !!u.done,
        starred: !!u.starred,
        note: u.note || "",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  res.json({ items });
});
