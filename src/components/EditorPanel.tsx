import { useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
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

function storedLang(): Language {
  const v = localStorage.getItem(LANG_KEY) as Language | null;
  return v && v in LANGS ? v : "python";
}
function starterFor(lang: Language) {
  return LANGS[lang].starter;
}

export function EditorPanel({ problemId }: { problemId: string }) {
  const { data: solutions, isLoading } = useSolutions(problemId);
  if (isLoading || !solutions) {
    return (
      <div className="grid h-full place-items-center rounded-xl border border-slate-200 dark:border-slate-800">
        <Spinner />
      </div>
    );
  }
  return <EditorInner problemId={problemId} initial={solutions} />;
}

function EditorInner({
  problemId,
  initial,
}: {
  problemId: string;
  initial: Record<string, string>;
}) {
  const { isDark } = useTheme();
  const save = useSaveSolution();

  const [lang, setLang] = useState<Language>(storedLang);
  const [savedMap, setSavedMap] = useState<Record<string, string>>({ ...initial });
  const draftsRef = useRef<Record<string, string>>({ ...initial });
  const [value, setValue] = useState<string>(() => initial[storedLang()] ?? starterFor(storedLang()));
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
    flush(lang, draftsRef.current[lang] ?? value); // persist current before switching
    localStorage.setItem(LANG_KEY, next);
    setLang(next);
    setValue(draftsRef.current[next] ?? savedMap[next] ?? starterFor(next));
  };

  const dirty = value !== (savedMap[lang] ?? starterFor(lang));
  const status = save.isPending ? "Saving…" : dirty ? "Unsaved" : "Saved";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-1.5 dark:border-slate-800">
        {LANG_ORDER.map((l) => (
          <button
            key={l}
            onClick={() => switchLang(l)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              l === lang
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {LANGS[l].label}
          </button>
        ))}
        <span
          className={`ml-auto text-xs ${
            dirty || save.isPending ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
          }`}
        >
          {status}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <CodeMirror
          value={value}
          height="100%"
          theme={isDark ? githubDark : githubLight}
          extensions={[LANGS[lang].ext() as never]}
          onChange={onChange}
          onBlur={() => flush(lang, draftsRef.current[lang] ?? value)}
          basicSetup={{ tabSize: 2, highlightActiveLine: true, autocompletion: true }}
        />
      </div>
    </div>
  );
}
