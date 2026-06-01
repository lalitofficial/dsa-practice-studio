// Add the "FAANG" sheet from ombharatiya/FAANG-Coding-Interview-Questions:
// one unit per company, problems in the repo's frequency order.
//
//   npm run migrate-faang
//
// Idempotent: problems upserted by { sheetId, slug }.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const root = fileURLToPath(new URL("..", import.meta.url));
const RAW = "https://raw.githubusercontent.com/ombharatiya/FAANG-Coding-Interview-Questions/master/README.md";
const SKIP = new Set([
  "Essential Resources",
  "Table of Contents",
  "Quick Start Guide",
  "About This Repository",
  "Contributing",
  "License",
]);

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

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const lcSlug = (url) => {
  const m = String(url || "").match(/problems\/([^/?#]+)/);
  return m ? m[1] : "";
};

function parseProblems(md) {
  const sections = md.split(/^##\s+/m).slice(1); // each starts with "<heading>\n..."
  const docs = [];
  let order = 0;
  const companies = [];

  for (const sec of sections) {
    const nl = sec.indexOf("\n");
    const company = sec.slice(0, nl).trim();
    if (SKIP.has(company)) continue;
    const body = sec.slice(nl);
    let count = 0;

    for (const line of body.split("\n")) {
      if (!line.includes("|")) continue;
      const cells = line.split("|").map((c) => c.trim());
      // expect: ["", No, Problem, Difficulty, Category, ""]
      const linkCell = cells[2] || "";
      const m = linkCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!m) continue; // header / separator / non-problem rows
      const title = m[1].trim();
      const url = m[2].trim();
      const difficulty = (cells[3] || "").trim();
      if (!/^(Easy|Medium|Hard)$/i.test(difficulty)) continue; // skip stray rows
      const slug = `${slugify(company)}-${lcSlug(url) || slugify(title)}`;
      docs.push({
        sheetId: "faang",
        sheetLabel: "FAANG",
        slug,
        title,
        unit: company,
        chapter: "Most Frequent",
        leetcodeUrl: url,
        youtubeUrl: "",
        resourceUrl: "",
        difficulty: difficulty[0].toUpperCase() + difficulty.slice(1).toLowerCase(),
        order: order++,
      });
      count++;
    }
    if (count) companies.push(`${company} (${count})`);
  }
  return { docs, companies };
}

async function main() {
  console.log(`→ fetching ${RAW}`);
  const res = await fetch(RAW);
  if (!res.ok) {
    console.error("✗ failed to fetch README:", res.status);
    process.exit(1);
  }
  const md = await res.text();
  const { docs, companies } = parseProblems(md);
  if (!docs.length) {
    console.error("✗ no problems parsed — the repo format may have changed.");
    process.exit(1);
  }
  console.log(`→ parsed ${docs.length} problems across ${companies.length} companies`);
  console.log("   " + companies.join(", "));

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log(`→ connected to ${dbName}`);

  await db.collection("problems").createIndex({ sheetId: 1, slug: 1 }, { unique: true });

  const ops = docs.map((doc) => ({
    updateOne: { filter: { sheetId: doc.sheetId, slug: doc.slug }, update: { $set: doc }, upsert: true },
  }));
  const result = await db.collection("problems").bulkWrite(ops, { ordered: false });

  // Place FAANG after existing sheets.
  const order = await db.collection("sheets").countDocuments({});
  await db
    .collection("sheets")
    .updateOne(
      { _id: "faang" },
      { $set: { _id: "faang", label: "FAANG", source: "github", order, total: docs.length } },
      { upsert: true },
    );

  console.log(`✓ FAANG: upserted ${result.upsertedCount}, updated ${result.modifiedCount} (total ${docs.length})`);
  await client.close();
}

main().catch((err) => {
  console.error("✗ failed:", err);
  process.exit(1);
});
