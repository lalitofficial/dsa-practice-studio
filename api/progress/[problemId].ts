import { ObjectId } from "mongodb";
import { withAuth, ensureMethod } from "../_lib/http";
import { getDb } from "../_lib/db";

// POST /api/progress/:problemId -> upsert { done?, starred?, note? } for the
// caller. sheetId is denormalized from the problem so per-sheet counts are cheap.
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["POST"])) return;
  const problemId = String(req.query.problemId || "");
  if (!ObjectId.isValid(problemId)) {
    res.status(400).json({ error: "Invalid problem id" });
    return;
  }
  const body = (req.body ?? {}) as {
    done?: boolean;
    starred?: boolean;
    note?: string;
    noteDoc?: string;
    sketch?: string;
  };
  const db = await getDb();

  const problem = await db.collection("problems").findOne({ _id: new ObjectId(problemId) });
  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  const set: Record<string, unknown> = { userId, problemId, sheetId: problem.sheetId };
  const unset: Record<string, ""> = {};
  if (typeof body.done === "boolean") {
    set.done = body.done;
    if (body.done) set.lastDoneAt = new Date().toISOString();
    else unset.lastDoneAt = "";
  }
  if (typeof body.starred === "boolean") set.starred = body.starred;
  if (typeof body.note === "string") set.note = body.note;
  if (typeof body.noteDoc === "string") set.noteDoc = body.noteDoc;
  if (typeof body.sketch === "string") set.sketch = body.sketch;

  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length) update.$unset = unset;

  await db
    .collection("userProblems")
    .updateOne({ userId, problemId }, update, { upsert: true });
  const saved = await db.collection("userProblems").findOne({ userId, problemId });

  res.json({
    progress: {
      problemId,
      done: !!saved?.done,
      starred: !!saved?.starred,
      note: saved?.note || "",
      sketch: saved?.sketch || "",
      lastDoneAt: saved?.lastDoneAt || "",
    },
  });
});
