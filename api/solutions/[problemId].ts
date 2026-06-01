import { ObjectId } from "mongodb";
import { withAuth, ensureMethod } from "../_lib/http";
import { getDb } from "../_lib/db";

// GET /api/solutions/:problemId  -> { solutions: { [language]: code } }
// PUT /api/solutions/:problemId  -> upsert { language, code } (autosave target)
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET", "PUT"])) return;
  const problemId = String(req.query.problemId || "");
  if (!ObjectId.isValid(problemId)) {
    res.status(400).json({ error: "Invalid problem id" });
    return;
  }
  const db = await getDb();

  if (req.method === "GET") {
    const docs = await db.collection("solutions").find({ userId, problemId }).toArray();
    const solutions: Record<string, string> = {};
    for (const d of docs) solutions[d.language] = d.code || "";
    res.json({ solutions });
    return;
  }

  const body = (req.body ?? {}) as { language?: string; code?: string };
  const language = String(body.language || "").trim();
  if (!language) {
    res.status(400).json({ error: "Missing language" });
    return;
  }
  const code = typeof body.code === "string" ? body.code : "";
  await db.collection("solutions").updateOne(
    { userId, problemId, language },
    { $set: { userId, problemId, language, code, updatedAt: new Date().toISOString() } },
    { upsert: true },
  );
  res.json({ ok: true });
});
