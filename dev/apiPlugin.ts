import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

// Dev-only: run the Vercel `/api` serverless functions in-process during
// `vite dev`, so `npm run dev` is a complete local environment (UI + API +
// MongoDB + Clerk) with no Vercel CLI/login. Production is unaffected — Vercel
// runs the same handlers as real serverless functions.

interface ApiRoute {
  pattern: RegExp;
  module: string;
  param?: string;
}

const ROUTES: ApiRoute[] = [
  { pattern: /^\/api\/sheets\/?$/, module: "/api/sheets.ts" },
  { pattern: /^\/api\/problems\/?$/, module: "/api/problems.ts" },
  { pattern: /^\/api\/all-problems\/?$/, module: "/api/all-problems.ts" },
  { pattern: /^\/api\/run\/?$/, module: "/api/run.ts" },
  { pattern: /^\/api\/revision\/?$/, module: "/api/revision.ts" },
  { pattern: /^\/api\/problem\/([^/]+)\/?$/, module: "/api/problem/[problemId].ts", param: "problemId" },
  { pattern: /^\/api\/progress\/([^/]+)\/?$/, module: "/api/progress/[problemId].ts", param: "problemId" },
  { pattern: /^\/api\/solutions\/([^/]+)\/?$/, module: "/api/solutions/[problemId].ts", param: "problemId" },
  { pattern: /^\/api\/leetcode\/([^/]+)\/?$/, module: "/api/leetcode/[slug].ts", param: "slug" },
];

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      if (!chunks.length) return resolve(undefined);
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
    req.on("error", () => resolve(undefined));
  });
}

// Minimal shim of the Vercel response API used by our handlers.
function makeRes(res: ServerResponse) {
  const shim = {
    status(code: number) {
      res.statusCode = code;
      return shim;
    },
    setHeader(key: string, value: string) {
      res.setHeader(key, value);
      return shim;
    },
    json(payload: unknown) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
      return shim;
    },
    send(payload: unknown) {
      res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
      return shim;
    },
    end(payload?: unknown) {
      res.end(payload as string | undefined);
      return shim;
    },
  };
  return shim;
}

export function devApiPlugin(): Plugin {
  return {
    name: "dev-api",
    apply: "serve",
    configResolved() {
      // Expose all .env / .env.local vars (incl. non-VITE_ secrets) to the
      // API handlers via process.env. These never reach the client bundle.
      const env = loadEnv("development", process.cwd(), "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        const pathname = url.split("?")[0];
        const queryString = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
        const route = ROUTES.find((r) => r.pattern.test(pathname));
        if (!route) return next();

        try {
          const query: Record<string, string> = {};
          new URLSearchParams(queryString).forEach((v, k) => (query[k] = v));
          const match = route.pattern.exec(pathname);
          if (route.param && match) query[route.param] = decodeURIComponent(match[1]);

          const body = await readBody(req);
          const shimReq = { method: req.method, headers: req.headers, query, body };

          const mod = await server.ssrLoadModule(route.module);
          await (mod.default as (rq: unknown, rs: unknown) => unknown)(shimReq, makeRes(res));
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Dev API error", detail: String((err as Error).message) }));
        }
      });
    },
  };
}
