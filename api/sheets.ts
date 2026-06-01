import { withAuth, ensureMethod } from "./_lib/http";
import { getDb } from "./_lib/db";

// GET /api/sheets -> all sheets with this user's done/total counts.
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const db = await getDb();

  const [sheets, totals, dones] = await Promise.all([
    db.collection("sheets").find({}).sort({ order: 1 }).toArray(),
    db
      .collection("problems")
      .aggregate([{ $group: { _id: "$sheetId", total: { $sum: 1 } } }])
      .toArray(),
    db
      .collection("userProblems")
      .aggregate([
        { $match: { userId, done: true } },
        { $group: { _id: "$sheetId", done: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const totalMap = new Map(totals.map((t) => [t._id, t.total as number]));
  const doneMap = new Map(dones.map((d) => [d._id, d.done as number]));

  res.json({
    sheets: sheets.map((s) => ({
      id: s._id,
      label: s.label,
      order: s.order ?? 0,
      total: totalMap.get(s._id) ?? 0,
      done: doneMap.get(s._id) ?? 0,
    })),
  });
});
