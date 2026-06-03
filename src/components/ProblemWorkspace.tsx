import { createContext, useContext, useMemo, type FC, type ReactNode } from "react";
import DOMPurify from "dompurify";
import {
  DockviewReact,
  themeGithubDark,
  themeGithubLight,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview";
import "dockview/dist/styles/dockview.css";
import { EditorPanel } from "./EditorPanel";
import { NoteBlocks } from "./NoteBlocks";
import { Spinner } from "./ui";
import { useReader } from "../lib/api";
import { leetcodeSlug } from "../lib/leetcode";
import { useTheme } from "../lib/theme";
import type { Problem } from "../lib/types";

function isGfgArticle(u: string): boolean {
  try {
    const h = new URL(u).hostname;
    return h.endsWith("geeksforgeeks.org") && !h.startsWith("practice.");
  } catch {
    return false;
  }
}

interface WorkspaceCtx {
  problem: Problem;
  statementHtml: string;
  statementLoading: boolean;
  premium?: boolean;
  tags?: string[];
  embed: string | null;
  solutionsUrl: string;
  onNoteDocChange: (d: { json: string; text: string }) => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);
const useWorkspace = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("WorkspaceCtx missing");
  return c;
};

const LAYOUT_KEY = "dsa-dock-v2";

// ---- panels ----

const QuestionPanel: FC<IDockviewPanelProps> = () => {
  const c = useWorkspace();
  const slug = c.problem.leetcodeUrl ? leetcodeSlug(c.problem.leetcodeUrl) : undefined;
  const gfg = c.problem.resourceUrl && isGfgArticle(c.problem.resourceUrl) ? c.problem.resourceUrl : "";
  return (
    <div className="h-full overflow-y-auto bg-white p-4 dark:bg-slate-900">
      {gfg ? (
        <GfgStatement url={gfg} />
      ) : (
        <StatementBlock
          slug={slug}
          html={c.statementHtml}
          tags={c.tags}
          loading={c.statementLoading}
          premium={c.premium}
          leetcodeUrl={c.problem.leetcodeUrl}
          resourceUrl={c.problem.resourceUrl}
        />
      )}
    </div>
  );
};

// Problem statement from a GeeksforGeeks article (shown in the Question panel).
function GfgStatement({ url }: { url: string }) {
  const { data, isLoading, isError } = useReader(url, true);
  const html = useMemo(
    () => (data?.statementHtml ? DOMPurify.sanitize(data.statementHtml) : ""),
    [data],
  );
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading problem…
      </div>
    );
  }
  if (isError || !html) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Couldn't load the statement here.{" "}
        <a className="text-indigo-600 underline dark:text-indigo-400" href={url} target="_blank" rel="noreferrer">
          Open on GeeksforGeeks ↗
        </a>
      </p>
    );
  }
  return (
    <div>
      <div className="lc-statement text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />
      <a
        className="mt-3 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Source: GeeksforGeeks ↗
      </a>
    </div>
  );
}

// The solution/approach from the same article (shown in the Solutions panel).
function GfgSolution({ url }: { url: string }) {
  const { data, isLoading } = useReader(url, true);
  const html = useMemo(() => (data?.solutionHtml ? DOMPurify.sanitize(data.solutionHtml) : ""), [data]);
  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading solution…
      </div>
    );
  }
  if (!html) return null;
  return (
    <div className="mt-1">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        GeeksforGeeks solution
      </h3>
      <div className="lc-statement text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

const SolutionsPanel: FC<IDockviewPanelProps> = () => {
  const c = useWorkspace();
  const p = c.problem;
  const linkCls =
    "rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
  return (
    <div className="h-full space-y-3 overflow-y-auto bg-white p-4 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Walkthrough &amp; references. Try solving first, then check here.
      </p>
      {c.embed ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <VideoFrame embed={c.embed} />
        </div>
      ) : (
        <p className="text-sm text-slate-400">No walkthrough video for this one.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {p.leetcodeUrl && (
          <a href={p.leetcodeUrl} target="_blank" rel="noreferrer" className={linkCls}>
            Open on LeetCode ↗
          </a>
        )}
        {c.solutionsUrl && (
          <a href={c.solutionsUrl} target="_blank" rel="noreferrer" className={linkCls}>
            LeetCode Solutions ↗
          </a>
        )}
        {p.resourceUrl && (
          <a href={p.resourceUrl} target="_blank" rel="noreferrer" className={linkCls}>
            Article ↗
          </a>
        )}
        {p.youtubeUrl && !c.embed && (
          <a href={p.youtubeUrl} target="_blank" rel="noreferrer" className={linkCls}>
            Video ↗
          </a>
        )}
      </div>
      {isGfgArticle(p.resourceUrl) && <GfgSolution url={p.resourceUrl} />}
    </div>
  );
};

const CodePanel: FC<IDockviewPanelProps> = () => {
  const c = useWorkspace();
  return (
    <div className="h-full bg-slate-50 p-1.5 dark:bg-slate-950">
      <EditorPanel key={c.problem.id} problemId={c.problem.id} leetcodeUrl={c.problem.leetcodeUrl} />
    </div>
  );
};

const NotesPanel: FC<IDockviewPanelProps> = () => {
  const c = useWorkspace();
  return (
    <div className="h-full bg-white dark:bg-slate-900">
      <NoteBlocks
        key={c.problem.id}
        docValue={c.problem.noteDoc}
        noteText={c.problem.note}
        onChange={c.onNoteDocChange}
      />
    </div>
  );
};

const components = {
  question: QuestionPanel,
  solutions: SolutionsPanel,
  code: CodePanel,
  notes: NotesPanel,
};

export function ProblemWorkspace(props: WorkspaceCtx) {
  const { isDark } = useTheme();

  const onReady = (event: DockviewReadyEvent) => {
    event.api.onDidLayoutChange(() => {
      try {
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(event.api.toJSON()));
      } catch {
        /* ignore quota errors */
      }
    });
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) {
      try {
        event.api.fromJSON(JSON.parse(saved));
        return;
      } catch {
        /* fall through to default layout */
      }
    }
    // Narrow screens: one group with all four as tabs. Desktop: Question/Solutions
    // on the left, Code/Notes on the right.
    const narrow = window.innerWidth < 1024;
    event.api.addPanel({ id: "question", component: "question", title: "Question" });
    event.api.addPanel({
      id: "solutions",
      component: "solutions",
      title: "Solutions",
      position: { referencePanel: "question", direction: "within" },
    });
    event.api.addPanel({
      id: "code",
      component: "code",
      title: "Code",
      position: { referencePanel: "question", direction: narrow ? "within" : "right" },
    });
    event.api.addPanel({
      id: "notes",
      component: "notes",
      title: "Notes",
      position: { referencePanel: "code", direction: "within" },
    });
    event.api.getPanel("question")?.api.setActive();
    if (!narrow) event.api.getPanel("code")?.api.setActive();
  };

  return (
    <Ctx.Provider value={props}>
      <DockviewReact
        className="size-full"
        components={components}
        theme={isDark ? themeGithubDark : themeGithubLight}
        onReady={onReady}
      />
    </Ctx.Provider>
  );
}

// ---- statement + video (shared by the Question / Solutions panels) ----

function StatementBlock({
  slug,
  html,
  tags,
  loading,
  premium,
  leetcodeUrl,
  resourceUrl,
}: {
  slug?: string;
  html: string;
  tags?: string[];
  loading: boolean;
  premium?: boolean;
  leetcodeUrl: string;
  resourceUrl: string;
}): ReactNode {
  if (html) {
    return (
      <div>
        {tags && tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div
          className="lc-statement text-slate-700 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading problem…
      </div>
    );
  }
  if (!slug) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Guided lesson</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          See the walkthrough video and article in the Solutions tab, then practice in the editor.
        </p>
        {resourceUrl && (
          <a
            href={resourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
          >
            Read the article ↗
          </a>
        )}
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {premium
          ? "This is a LeetCode Premium problem, so the statement can't be shown here."
          : "Couldn't load the problem statement here."}
      </p>
      <a
        href={leetcodeUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
      >
        Read on LeetCode ↗
      </a>
    </div>
  );
}

function VideoFrame({ embed }: { embed: string }) {
  return (
    <div className="aspect-video">
      <iframe
        src={embed}
        title="Tutorial video"
        className="size-full"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
