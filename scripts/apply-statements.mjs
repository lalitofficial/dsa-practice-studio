// Load authored problem statements (scripts/statements.json) into MongoDB for
// the Striver problems that have no LeetCode link. Matches by normalized title.
//
//   npm run apply-statements
//
// Idempotent ($set). Reports any statement that didn't match a problem, and any
// link-less problem still missing a statement.

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

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const readJson = (p) => JSON.parse(readFileSync(root + p, "utf8"));

async function main() {
  const statements = readJson("scripts/statements.json");
  const lessons = readJson(".striver_tracker/lessons.json");

  // Map normalized title -> slug(s), only for link-less Striver lessons.
  const titleToIds = new Map();
  const linkless = lessons.filter((l) => !l.leetcode_url && l.id && l.title);
  for (const l of linkless) {
    const key = norm(l.title);
    if (!titleToIds.has(key)) titleToIds.set(key, []);
    titleToIds.get(key).push(l.id);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log(`→ connected to ${dbName}`);

  const matchedSlugs = new Set();
  const unmatchedStatements = [];

  for (const [title, statement] of Object.entries(statements)) {
    const ids = titleToIds.get(norm(title));
    if (!ids || ids.length === 0) {
      unmatchedStatements.push(title);
      continue;
    }
    await db
      .collection("problems")
      .updateMany({ sheetId: "striver", slug: { $in: ids } }, { $set: { statement } });
    ids.forEach((id) => matchedSlugs.add(id));
  }

  const missingStatement = linkless.filter((l) => !matchedSlugs.has(l.id)).map((l) => l.title);

  console.log(`✓ statements applied to ${matchedSlugs.size} of ${linkless.length} link-less problems`);
  if (unmatchedStatements.length) {
    console.log(`! ${unmatchedStatements.length} statement title(s) matched no problem:`);
    unmatchedStatements.forEach((t) => console.log(`    - ${t}`));
  }
  if (missingStatement.length) {
    console.log(`! ${missingStatement.length} link-less problem(s) still without a statement:`);
    missingStatement.forEach((t) => console.log(`    - ${t.replace(/\s+/g, " ").trim()}`));
  }
  if (!unmatchedStatements.length && !missingStatement.length) {
    console.log("✓ every link-less problem now has a statement");
  }

  await client.close();
}

main().catch((err) => {
  console.error("✗ failed:", err);
  process.exit(1);
});
