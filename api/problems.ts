import { withAuth, ensureMethod } from "./_lib/http";
import { getDb } from "./_lib/db";

// GET /api/problems?sheet=<id> -> curated problems for the sheet merged with
// the caller's progress (done / starred / note).
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const sheet = String(req.query.sheet || "");
  if (!sheet) {
    res.status(400).json({ error: "Missing ?sheet" });
    return;
  }
  const db = await getDb();

  const [problems, userProblems] = await Promise.all([
    db.collection("problems").find({ sheetId: sheet }).sort({ order: 1 }).toArray(),
    db.collection("userProblems").find({ userId, sheetId: sheet }).toArray(),
  ]);

  const up = new Map(userProblems.map((u) => [u.problemId, u]));

  res.json({
    problems: problems.map((p) => {
      const u = up.get(p._id.toString());
      return {
        id: p._id.toString(),
        sheetId: p.sheetId,
        unit: p.unit,
        chapter: p.chapter,
        title: p.title,
        leetcodeUrl: p.leetcodeUrl || "",
        youtubeUrl: p.youtubeUrl || "",
        resourceUrl: p.resourceUrl || "",
        difficulty: p.difficulty || "",
        order: p.order ?? 0,
        done: !!u?.done,
        starred: !!u?.starred,
        note: u?.note || "",
      };
    }),
  });
});
