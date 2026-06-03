import { createContext, useContext, useMemo, useState, type FC, type ReactNode } from "react";
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
      <StatementBlock
        slug={slug}
        html={c.statementHtml}
        tags={c.tags}
        loading={c.statementLoading}
        premium={c.premium}
        leetcodeUrl={c.problem.leetcodeUrl}
        resourceUrl={c.problem.resourceUrl}
      />
      {gfg && <GfgReader url={gfg} />}
    </div>
  );
};

function GfgReader({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useReader(url, open);
  const html = useMemo(() => (data?.html ? DOMPurify.sanitize(data.html) : ""), [data]);
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
      >
        <span className="text-slate-400">{open ? "▾" : "▸"}</span>
        Read the GeeksforGeeks article in-app
        <span className="text-xs font-normal text-amber-600 dark:text-amber-400">(includes the solution)</span>
      </button>
      {open && (
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Spinner /> Loading article…
            </div>
          ) : isError || !html ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Couldn't load it here.{" "}
              <a className="text-indigo-600 underline dark:text-indigo-400" href={url} target="_blank" rel="noreferrer">
                Open on GeeksforGeeks ↗
              </a>
            </p>
          ) : (
            <>
              <div
                className="lc-statement text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: html }}
              />
              <a
                className="mt-3 inline-block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Source: GeeksforGeeks ↗
              </a>
            </>
          )}
        </div>
      )}
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
