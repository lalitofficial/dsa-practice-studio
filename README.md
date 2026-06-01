# DSA Mastery Studio

A focused, distraction-free place to master Data Structures & Algorithms — curated tracks,
a built-in code editor that autosaves your solutions, notes, stars, and a revision hub, all
synced across **phone, iPad, and Mac** from a single URL.

- **Curated content** — Striver A→Z (455 problems) + AlgoMaster (300), grouped by topic, each
  with LeetCode / YouTube / article links and difficulty.
- **Read & solve in-app** — the LeetCode problem statement is fetched and rendered right next to
  the editor, so you can attempt it first-hand without leaving the app.
- **Built-in editor** — CodeMirror with Python / C++ / Java / JavaScript tabs, autosave, full-screen
  mode, font-size/word-wrap controls, and one-click "copy code → open on LeetCode".
- **Your progress, everywhere** — done/star/notes per problem, synced via your login.
- **Installable** — add it to your iPhone/iPad home screen (PWA).

## Cost: $0

Everything runs on free tiers — no server to rent:

| Piece | Service | Tier |
| --- | --- | --- |
| App UI + API | **Vercel** (Hobby) | Free, no card |
| Database | **MongoDB Atlas** (M0) | Free, 512 MB |
| Login | **Clerk** | Free up to 10k users |
| Domain | your own | already owned |

```
Phone / iPad / Mac ─► your domain (Vercel)
                        ├─ React SPA (static)           ← Clerk login
                        └─ /api/* serverless functions  ─► MongoDB Atlas
                              ▲ verifies the Clerk token
```

## Tech stack

React 18 + Vite + TypeScript + Tailwind v4 · TanStack Query · Clerk · CodeMirror 6 ·
Vercel serverless functions (Node) · MongoDB driver.

---

## 1. Get free accounts & keys

### MongoDB Atlas
1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user (username + password).
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere) for simplicity.
4. **Connect → Drivers** → copy the connection string (`mongodb+srv://…`).

### Clerk
1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. **API Keys** → copy the **Publishable key** (`pk_…`) and **Secret key** (`sk_…`).

### Configure env
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="dsa_studio"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

## 2. Install & load the content

```bash
npm install
npm run migrate            # loads Striver + AlgoMaster into MongoDB (idempotent)
npm run apply-statements   # adds in-app statements for Striver items without a LeetCode link
```
You should see `problems per sheet: { striver: 455, algomaster: 300 }` and
`statements applied to 186 of 186 link-less problems`.

## 3. Run locally

```bash
npm run dev          # http://localhost:5173
```
That's it — the UI **and** the `/api` functions run together. In dev, a small Vite plugin
(`dev/apiPlugin.ts`) executes the same `/api` handlers in-process against your MongoDB + Clerk,
so no Vercel CLI or login is needed locally. Sign in, pick a track, solve, take notes, type code →
reload and everything persists.

> Production uses the real Vercel serverless functions (the identical handlers). If you prefer to
> mirror that locally you can also `npm i -g vercel && vercel dev`, but it's not required.

## 4. Deploy

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (framework auto-detected as Vite).
3. In **Project → Settings → Environment Variables**, add the same four vars from `.env.local`.
4. Deploy. Then **Settings → Domains** → add your domain and follow the DNS instructions.
5. In Clerk, add your production domain under **Domains** so login works there too.

Open the URL on your phone and iPad — same login, same progress.

## Project structure

```
api/                 Vercel serverless functions (Node + MongoDB + Clerk)
  _lib/              shared db connection + auth helpers (underscore = not an endpoint)
  sheets.ts          GET  /api/sheets
  problems.ts        GET  /api/problems?sheet=<id>
  problem/[id].ts    GET  /api/problem/:id
  progress/[id].ts   POST /api/progress/:id   (done / starred / note)
  solutions/[id].ts  GET|PUT /api/solutions/:id
  revision.ts        GET  /api/revision
  leetcode/[slug].ts GET  /api/leetcode/:slug  (proxies LeetCode's public statement)
src/
  pages/             Dashboard, SheetView, ProblemView, Revision
  components/        AppShell, EditorPanel, SignInScreen, ui atoms
  lib/               api hooks (TanStack Query), types, theme
scripts/migrate.mjs  one-time content migration
legacy/              the original Flask + vanilla-JS app, archived for reference
```

## Data model (MongoDB)

- `problems` — curated content (global): sheet, unit, chapter, title, links, difficulty.
- `sheets` — sheet registry with labels.
- `userProblems` — per-user `{ done, starred, note }`, keyed by `(userId, problemId)`.
- `solutions` — per-user saved code, keyed by `(userId, problemId, language)`.

## Adding / re-importing content

Edit the JSON the migration reads (`.striver_tracker/*.json`) or extend `scripts/migrate.mjs`,
then re-run `npm run migrate`. It upserts by `(sheetId, slug)`, so re-running never duplicates.
