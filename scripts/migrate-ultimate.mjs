// Load the Ultimate DSA Sheet (scripts/ultimate.json) into MongoDB as the
// "ultimate" sheet, grouped by topic. Idempotent (upsert by sheetId+slug).
//
//   npm run migrate-ultimate

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const root = fileURLToPath(new URL("..", import.meta.url));

function loadEnvLocal() {
  const envPath = root + ".env.local";
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "dsa_studio";
if (!uri) {
  console.error("✗ MONGODB_URI is not set (see .env.example).");
  process.exit(1);
}

const esc = (s) =>
  String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function externalStatement(url, remarks, companies) {
  let html = `<p>This problem is hosted on an external judge — <a href="${url}" target="_blank" rel="noreferrer">open it ↗</a> to read the full statement and submit.</p>`;
  if (remarks) html += `<p><strong>Hint:</strong> ${esc(remarks)}</p>`;
  if (companies) html += `<p><strong>Asked at:</strong> ${esc(companies)}</p>`;
  return html;
}

async function main() {
  const items = JSON.parse(readFileSync(root + "scripts/ultimate.json", "utf8"));
  const docs = items.map((it) => {
    const isLeet = /(^|\.)leetcode\.com/.test(new URL(it.url).hostname);
    return {
      sheetId: "ultimate",
      sheetLabel: "Ultimate DSA Sheet",
      slug: `ultimate-${it.index}`,
      title: it.title,
      unit: it.topic,
      chapter: "Problems",
      leetcodeUrl: isLeet ? it.url : "",
      resourceUrl: isLeet ? "" : it.url,
      youtubeUrl: "",
      difficulty: it.difficulty || "",
      statement: isLeet ? "" : externalStatement(it.url, it.remarks, it.companies),
      companies: it.companies || "",
      remarks: it.remarks || "",
      order: it.index,
    };
  });

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log(`→ connected to ${dbName}`);
  await db.collection("problems").createIndex({ sheetId: 1, slug: 1 }, { unique: true });

  const ops = docs.map((doc) => ({
    updateOne: { filter: { sheetId: doc.sheetId, slug: doc.slug }, update: { $set: doc }, upsert: true },
  }));
  const result = await db.collection("problems").bulkWrite(ops, { ordered: false });

  const order = await db.collection("sheets").countDocuments({ _id: { $ne: "ultimate" } });
  await db.collection("sheets").updateOne(
    { _id: "ultimate" },
    {
      $set: {
        _id: "ultimate",
        label: "Ultimate DSA Sheet",
        source: "sheet",
        order,
        total: docs.length,
        sourceUrl:
          "https://docs.google.com/spreadsheets/d/1Or6lZt6b8hrE2mJxiWazlXfMwBEm3JASKN512Vk41Do/edit?gid=0#gid=0",
      },
    },
    { upsert: true },
  );

  const topics = [...new Set(docs.map((d) => d.unit))];
  console.log(`✓ Ultimate DSA Sheet: ${docs.length} problems across ${topics.length} topics`);
  console.log(`  upserted ${result.upsertedCount}, updated ${result.modifiedCount}`);
  await client.close();
}

main().catch((err) => {
  console.error("✗ failed:", err);
  process.exit(1);
});
