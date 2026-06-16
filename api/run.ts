import { withAuth, ensureMethod } from "./_lib/http";

// POST /api/run -> compile & run code via Wandbox (free public compiler service).
// Body: { language: "python"|"cpp"|"java"|"javascript", code, stdin }
// Returns compile/stdout/stderr/exit so the editor shows a real console.
const WANDBOX = "https://wandbox.org/api";

// Pick the newest available compiler per language (robust to Wandbox's version
// churn). Compiler list is cached across warm invocations.
const PATTERNS: Record<string, RegExp> = {
  cpp: /^gcc-\d+\.\d+\.\d+$/, // bare gcc = C++ (the "-c" suffix is the C compiler)
  python: /^cpython-3\./,
  java: /^openjdk-/,
  javascript: /^nodejs-/,
};

let compilers: string[] | null = null;

async function pickCompiler(language: string): Promise<string | null> {
  const pat = PATTERNS[language];
  if (!pat) return null;
  if (!compilers) {
    const r = await fetch(`${WANDBOX}/list.json`);
    if (!r.ok) return null;
    compilers = ((await r.json()) as { name: string }[]).map((c) => c.name);
  }
  return compilers.find((n) => pat.test(n)) ?? null;
}

export default withAuth(async ({ req, res }) => {
  if (!ensureMethod(req, res, ["POST"])) return;
  const body = (req.body ?? {}) as { language?: string; code?: string; stdin?: string };
  if (!body.language || !PATTERNS[body.language]) {
    res.status(400).json({ error: "Unsupported language" });
    return;
  }
  const code = typeof body.code === "string" ? body.code : "";
  const stdin = typeof body.stdin === "string" ? body.stdin : "";
  if (!code.trim()) {
    res.status(400).json({ error: "Nothing to run" });
    return;
  }

  try {
    const compiler = await pickCompiler(body.language);
    if (!compiler) {
      res.status(502).json({ error: "Execution runtime unavailable" });
      return;
    }
    const payload: Record<string, unknown> = { compiler, code, stdin, save: false };
    if (body.language === "cpp") payload["compiler-option-raw"] = "-std=gnu++17\n-O2";

    const resp = await fetch(`${WANDBOX}/compile.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      res.status(502).json({ error: "Execution service error", detail: (await resp.text()).slice(0, 200) });
      return;
    }
    const d = (await resp.json()) as {
      status?: string;
      signal?: string;
      compiler_error?: string;
      program_output?: string;
      program_error?: string;
      program_message?: string;
    };
    res.json({
      compileOutput: d.compiler_error || "",
      stdout: d.program_output || "",
      stderr: d.program_error || "",
      output: d.program_message || "",
      code: d.status != null ? Number(d.status) : null,
      signal: d.signal || null,
    });
  } catch (err) {
    res.status(502).json({ error: "Run failed", detail: String((err as Error)?.message).slice(0, 200) });
  }
});
