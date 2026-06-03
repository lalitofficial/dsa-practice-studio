import { withAuth, ensureMethod } from "./_lib/http";
import { getDb } from "./_lib/db";

// GET /api/sheets -> all sheets with this user's done/total counts.
export default withAuth(async ({ req, res, userId }) => {
  if (!ensureMethod(req, res, ["GET"])) return;
  const db = await getDb();

  // Per-user done counts (must be computed live). Sheet totals are precomputed
  // on the sheet docs by the migrations, so we avoid scanning every problem here.
  const [sheets, dones] = await Promise.all([
    db.collection("sheets").find({}).sort({ order: 1 }).toArray(),
    db
      .collection("userProblems")
      .aggregate([
        { $match: { userId, done: true } },
        { $group: { _id: "$sheetId", done: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  // Fallback only if a sheet is missing its cached total.
  let totalMap: Map<string, number> | null = null;
  if (sheets.some((s) => typeof s.total !== "number")) {
    const totals = await db
      .collection("problems")
      .aggregate([{ $group: { _id: "$sheetId", total: { $sum: 1 } } }])
      .toArray();
    totalMap = new Map(totals.map((t) => [String(t._id), t.total as number] as [string, number]));
  }

  const doneMap = new Map(dones.map((d) => [d._id, d.done as number]));

  res.json({
    sheets: sheets.map((s) => ({
      id: s._id,
      label: s.label,
      order: s.order ?? 0,
      total: typeof s.total === "number" ? s.total : (totalMap?.get(String(s._id)) ?? 0),
      done: doneMap.get(s._id) ?? 0,
      sourceUrl: s.sourceUrl || "",
    })),
  });
});
