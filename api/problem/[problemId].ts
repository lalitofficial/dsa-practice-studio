import { ObjectId } from "mongodb";
import { withAuth, ensureMethod } from "../_lib/http";
import { getDb } from "../_lib/db";

// GET /api/problem/:problemId -> a single curated problem merged with the
// caller's progress. Supports deep-linking / refresh on the study view.
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const problemId = String(req.query.problemId || "");
  if (!ObjectId.isValid(problemId)) {
    res.status(400).json({ error: "Invalid problem id" });
    return;
  }
  const db = await getDb();
  const p = await db.collection("problems").findOne({ _id: new ObjectId(problemId) });
  if (!p) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }
  const u = await db.collection("userProblems").findOne({ userId, problemId });

  res.json({
    problem: {
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
      sketch: u?.sketch || "",
      statement: p.statement || "",
    },
  });
});
