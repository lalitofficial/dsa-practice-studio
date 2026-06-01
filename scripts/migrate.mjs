// One-time (idempotent) migration: load the curated Striver + AlgoMaster sheets
// from the legacy .striver_tracker/*.json files into MongoDB Atlas.
//
//   npm run migrate
//
// Reads MONGODB_URI / MONGODB_DB from the environment, falling back to .env.local.
// Safe to re-run: problems are upserted by { sheetId, slug }.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const root = fileURLToPath(new URL("..", import.meta.url));

// --- tiny .env.local loader (no dependency) ---
function loadEnvLocal() {
  const envPath = root + ".env.local";
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "dsa_studio";
if (!uri) {
  console.error("✗ MONGODB_URI is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

// Which legacy file maps to which sheet id.
const SHEET_FILES = [
  { sheetId: "striver", file: ".striver_tracker/lessons.json" },
  { sheetId: "algomaster", file: ".striver_tracker/lessons_algomaster.json" },
];

function readJson(relPath) {
  const full = root + relPath;
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, "utf8"));
}

function labelFor(sheetId) {
  const sheets = readJson(".striver_tracker/sheets.json") || [];
  const match = sheets.find((s) => s.id === sheetId);
  if (match?.label) return match.label;
  return sheetId.charAt(0).toUpperCase() + sheetId.slice(1);
}

// Drop malformed YouTube links (a valid video id is exactly 11 chars), so the
// study view never shows a broken embed.
function cleanYouTube(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    let id = u.hostname.includes("youtu.be")
      ? u.pathname.slice(1).split("/")[0]
      : u.searchParams.get("v") ||
        (u.pathname.startsWith("/embed/") ? u.pathname.split("/embed/")[1] : "");
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? url : "";
  } catch {
    return "";
  }
}

function toProblem(lesson, sheetId, sheetLabel) {
  return {
    sheetId,
    sheetLabel,
    slug: String(lesson.id), // stable key for idempotent upsert
    title: String(lesson.title || "").trim(),
    unit: String(lesson.unit || "General").trim(),
    chapter: String(lesson.chapter || "General").trim(),
    leetcodeUrl: lesson.leetcode_url || lesson.url || "",
    youtubeUrl: cleanYouTube(lesson.youtube_url || ""),
    resourceUrl: lesson.resource_url || "",
    difficulty: lesson.difficulty || "",
    order: Number.isFinite(lesson.order) ? lesson.order : 0,
  };
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log(`→ connected to ${dbName}`);

  // Indexes
  await db.collection("problems").createIndex({ sheetId: 1, slug: 1 }, { unique: true });
  await db.collection("problems").createIndex({ sheetId: 1, order: 1 });
  await db.collection("userProblems").createIndex({ userId: 1, problemId: 1 }, { unique: true });
  await db.collection("userProblems").createIndex({ userId: 1, sheetId: 1 });
  await db
    .collection("solutions")
    .createIndex({ userId: 1, problemId: 1, language: 1 }, { unique: true });

  const sheetDocs = [];
  let order = 0;
  let totalProblems = 0;

  for (const { sheetId, file } of SHEET_FILES) {
    const lessons = readJson(file);
    if (!lessons) {
      console.warn(`! skipping ${sheetId}: ${file} not found`);
      continue;
    }
    const sheetLabel = labelFor(sheetId);
    sheetDocs.push({ _id: sheetId, label: sheetLabel, source: "sample", order: order++ });

    const ops = lessons
      .filter((l) => l && l.title && l.id)
      .map((l) => {
        const doc = toProblem(l, sheetId, sheetLabel);
        return {
          updateOne: {
            filter: { sheetId: doc.sheetId, slug: doc.slug },
            update: { $set: doc },
            upsert: true,
          },
        };
      });

    if (ops.length) {
      const result = await db.collection("problems").bulkWrite(ops, { ordered: false });
      const touched = result.upsertedCount + result.modifiedCount + result.matchedCount;
      console.log(`✓ ${sheetId}: ${touched} problems (upserted ${result.upsertedCount})`);
      totalProblems += ops.length;
    }
  }

  // Upsert sheet registry.
  for (const s of sheetDocs) {
    await db
      .collection("sheets")
      .updateOne({ _id: s._id }, { $set: s }, { upsert: true });
  }

  const counts = await db
    .collection("problems")
    .aggregate([{ $group: { _id: "$sheetId", n: { $sum: 1 } } }])
    .toArray();
  console.log("→ problems per sheet:", Object.fromEntries(counts.map((c) => [c._id, c.n])));
  console.log(`✓ migration complete (${totalProblems} problems processed)`);

  await client.close();
}

main().catch((err) => {
  console.error("✗ migration failed:", err);
  process.exit(1);
});
