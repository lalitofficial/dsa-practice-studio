import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { useSaveSolution, useSolutions } from "../lib/api";
import { useTheme } from "../lib/theme";
import { Spinner } from "./ui";
import type { Language } from "../lib/types";

const LANGS: Record<Language, { label: string; ext: () => unknown; starter: string }> = {
  python: {
    label: "Python",
    ext: python,
    starter: "class Solution:\n    def solve(self):\n        pass\n",
  },
  cpp: {
    label: "C++",
    ext: cpp,
    starter: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  },
  java: {
    label: "Java",
    ext: java,
    starter: "public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  },
  javascript: {
    label: "JavaScript",
    ext: javascript,
    starter: "function solve() {\n  \n}\n",
  },
};
const LANG_ORDER: Language[] = ["python", "cpp", "java", "javascript"];
const LANG_KEY = "dsa-lang";
const FONT_KEY = "dsa-fontsize";
const WRAP_KEY = "dsa-wrap";

function storedLang(): Language {
  const v = localStorage.getItem(LANG_KEY) as Language | null;
  return v && v in LANGS ? v : "python";
}
function starterFor(lang: Language) {
  return LANGS[lang].starter;
}

export function EditorPanel({
  problemId,
  leetcodeUrl,
}: {
  problemId: string;
  leetcodeUrl?: string;
}) {
  const { data: solutions, isLoading } = useSolutions(problemId);
  if (isLoading || !solutions) {
    return (
      <div className="grid h-full place-items-center rounded-xl border border-slate-200 dark:border-slate-800">
        <Spinner />
      </div>
    );
  }
  return <EditorInner problemId={problemId} leetcodeUrl={leetcodeUrl} initial={solutions} />;
}

function EditorInner({
  problemId,
  leetcodeUrl,
  initial,
}: {
  problemId: string;
  leetcodeUrl?: string;
  initial: Record<string, string>;
}) {
  const { isDark } = useTheme();
  const save = useSaveSolution();

  const [lang, setLang] = useState<Language>(storedLang);
  const [savedMap, setSavedMap] = useState<Record<string, string>>({ ...initial });
  const draftsRef = useRef<Record<string, string>>({ ...initial });
  const [value, setValue] = useState<string>(() => initial[storedLang()] ?? starterFor(storedLang()));
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    const v = Number(localStorage.getItem(FONT_KEY));
    return Number.isFinite(v) && v >= 11 && v <= 24 ? v : 14;
  });
  const [wrap, setWrap] = useState<boolean>(() => localStorage.getItem(WRAP_KEY) === "1");

  useEffect(() => localStorage.setItem(FONT_KEY, String(fontSize)), [fontSize]);
  useEffect(() => localStorage.setItem(WRAP_KEY, wrap ? "1" : "0"), [wrap]);
  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  const flush = (l: Language, code: string) => {
    if (code === savedMap[l]) return;
    save.mutate(
      { problemId, language: l, code },
      { onSuccess: () => setSavedMap((m) => ({ ...m, [l]: code })) },
    );
  };

  const scheduleSave = (l: Language, code: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flush(l, code), 700);
  };

  const onChange = (next: string) => {
    setValue(next);
    draftsRef.current[lang] = next;
    scheduleSave(lang, next);
  };

  const switchLang = (next: Language) => {
    clearTimeout(timerRef.current);
    flush(lang, draftsRef.current[lang] ?? value);
    localStorage.setItem(LANG_KEY, next);
    setLang(next);
    setValue(draftsRef.current[next] ?? savedMap[next] ?? starterFor(next));
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const resetCode = () => {
    if (!window.confirm(`Reset ${LANGS[lang].label} to the starter template? Your saved code for it will be overwritten.`))
      return;
    const s = starterFor(lang);
    setValue(s);
    draftsRef.current[lang] = s;
    flush(lang, s);
  };

  const copyAndOpenLeetCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
    if (leetcodeUrl) window.open(leetcodeUrl, "_blank", "noopener,noreferrer");
  };

  // Esc exits fullscreen; Cmd/Ctrl+S force-saves (and blocks the browser dialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush(lang, draftsRef.current[lang] ?? value);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen, lang, value]);

  const extensions = useMemo(() => {
    const list: unknown[] = [LANGS[lang].ext()];
    if (wrap) list.push(EditorView.lineWrapping);
    list.push(EditorView.theme({ "&": { fontSize: `${fontSize}px` } }));
    return list as never[];
  }, [lang, wrap, fontSize]);

  const dirty = value !== (savedMap[lang] ?? starterFor(lang));
  const status = save.isPending ? "Saving…" : dirty ? "Unsaved" : "Saved";

  const action =
    "rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";
  const actionActive =
    "rounded-md px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300";

  const panel = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2 py-1.5 dark:border-slate-800">
        <select
          value={lang}
          onChange={(e) => switchLang(e.target.value as Language)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          title="Language"
        >
          {LANG_ORDER.map((l) => (
            <option key={l} value={l}>
              {LANGS[l].label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setFontSize((s) => Math.max(11, s - 1))} className={action} title="Smaller font">
            A−
          </button>
          <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} className={action} title="Larger font">
            A+
          </button>
          <button onClick={() => setWrap((w) => !w)} className={wrap ? actionActive : action} title="Toggle word wrap">
            Wrap
          </button>
          <button onClick={copyCode} className={action} title="Copy code">
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={resetCode} className={action} title="Reset to starter template">
            Reset
          </button>
          {leetcodeUrl && (
            <button
              onClick={copyAndOpenLeetCode}
              className="rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600"
              title="Copy your code and open the problem on LeetCode"
            >
              Copy → LeetCode ↗
            </button>
          )}
          <button
            onClick={() => setFullscreen((f) => !f)}
            className={action}
            title={fullscreen ? "Exit full screen (Esc)" : "Full screen"}
          >
            {fullscreen ? <CompressIcon /> : <ExpandIcon />}
          </button>
          <span
            className={`ml-1 w-14 text-right text-xs ${
              dirty || save.isPending ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <CodeMirror
          value={value}
          className="h-full"
          height="100%"
          theme={isDark ? githubDark : githubLight}
          extensions={extensions}
          onChange={onChange}
          onBlur={() => flush(lang, draftsRef.current[lang] ?? value)}
          basicSetup={{ tabSize: 2, highlightActiveLine: true, autocompletion: true }}
        />
      </div>
    </div>
  );

  return fullscreen ? (
    <div className="fixed inset-0 z-50 bg-slate-100 p-2 dark:bg-slate-950">{panel}</div>
  ) : (
    <div className="h-full">{panel}</div>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CompressIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
