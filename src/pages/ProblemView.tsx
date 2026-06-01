import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useLeetCodeStatement, useProblem, useProblems, useUpdateProgress } from "../lib/api";
import { leetcodeSlug } from "../lib/leetcode";
import { EditorPanel } from "../components/EditorPanel";
import { CenteredMessage, DifficultyBadge, EmptyState, Spinner } from "../components/ui";
import type { LeetCodeStatement } from "../lib/types";

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.searchParams.get("v")) id = u.searchParams.get("v") ?? "";
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1];
    if (!id) return null;
    const t = u.searchParams.get("t") || u.searchParams.get("start");
    const start = t ? parseInt(t, 10) : NaN;
    return `https://www.youtube.com/embed/${id}${Number.isFinite(start) ? `?start=${start}` : ""}`;
  } catch {
    return null;
  }
}

export default function ProblemView() {
  const { problemId } = useParams();
  const { data: problem, isLoading, isError } = useProblem(problemId);
  const { data: siblings } = useProblems(problem?.sheetId);
  const update = useUpdateProgress();
  const navigate = useNavigate();

  const slug = problem?.leetcodeUrl ? leetcodeSlug(problem.leetcodeUrl) : undefined;
  const statementQuery = useLeetCodeStatement(slug);
  const cleanHtml = useMemo(
    () => (statementQuery.data?.content ? DOMPurify.sanitize(statementQuery.data.content) : ""),
    [statementQuery.data],
  );

  const [note, setNote] = useState("");
  const noteTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setNote(problem?.note ?? "");
  }, [problem?.id, problem?.note]);

  // Remember the last opened problem so the Dashboard can offer "Resume".
  useEffect(() => {
    if (problem) {
      localStorage.setItem(
        "dsa-last",
        JSON.stringify({ id: problem.id, title: problem.title, sheetId: problem.sheetId }),
      );
    }
  }, [problem]);

  if (isLoading) {
    return (
      <CenteredMessage>
        <Spinner />
      </CenteredMessage>
    );
  }
  if (isError || !problem) {
    return <EmptyState title="Problem not found" hint="It may have been removed or the link is wrong." />;
  }

  const sheetId = problem.sheetId;
  const solutionsUrl = problem.leetcodeUrl
    ? problem.leetcodeUrl.replace(/\/+$/, "") + "/solutions/"
    : "";
  const onNoteChange = (value: string) => {
    setNote(value);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      update.mutate({ problemId: problem.id, sheetId, patch: { note: value } });
    }, 700);
  };

  const idx = siblings?.findIndex((p) => p.id === problem.id) ?? -1;
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = siblings && idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const embed = problem.youtubeUrl ? youtubeEmbed(problem.youtubeUrl) : null;

  return (
    <div className="space-y-5">
      {/* Breadcrumb + prev/next */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <Link
          to={`/sheet/${sheetId}`}
          className="truncate text-slate-500 hover:text-indigo-600 dark:text-slate-400"
        >
          ← {problem.unit} <span className="text-slate-300 dark:text-slate-600">/</span> {problem.chapter}
        </Link>
        <div className="flex shrink-0 gap-1">
          <NavBtn to={prev ? `/problem/${prev.id}` : undefined} label="Prev" />
          <NavBtn to={next ? `/problem/${next.id}` : undefined} label="Next" />
        </div>
      </div>

      {/* Title row */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <DifficultyBadge value={problem.difficulty} />
        <button
          onClick={() => update.mutate({ problemId: problem.id, sheetId, patch: { starred: !problem.starred } })}
          className={`text-2xl leading-none ${problem.starred ? "text-amber-400" : "text-slate-300 hover:text-amber-400 dark:text-slate-600"}`}
          title={problem.starred ? "Unstar" : "Star"}
        >
          {problem.starred ? "★" : "☆"}
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => update.mutate({ problemId: problem.id, sheetId, patch: { done: !problem.done } })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              problem.done
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {problem.done ? "✓ Solved" : "Mark as solved"}
          </button>
          {next && (
            <button
              onClick={() => {
                update.mutate({ problemId: problem.id, sheetId, patch: { done: true } });
                navigate(`/problem/${next.id}`);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Mark solved and go to the next problem"
            >
              Solved → Next
            </button>
          )}
        </div>
      </div>

      {/* Resource links */}
      <div className="flex flex-wrap gap-2">
        {problem.leetcodeUrl && (
          <ResourceLink href={problem.leetcodeUrl} className="bg-amber-500 text-white hover:bg-amber-600">
            Solve on LeetCode ↗
          </ResourceLink>
        )}
        {solutionsUrl && (
          <ResourceLink
            href={solutionsUrl}
            className="border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            LC Solutions ↗
          </ResourceLink>
        )}
        {problem.resourceUrl && (
          <ResourceLink
            href={problem.resourceUrl}
            className="border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Article ↗
          </ResourceLink>
        )}
        {problem.youtubeUrl && !embed && (
          <ResourceLink href={problem.youtubeUrl} className="bg-rose-500 text-white hover:bg-rose-600">
            Watch on YouTube ↗
          </ResourceLink>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:h-[calc(100vh-15rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Learn column */}
        <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
          <StatementBlock
            slug={slug}
            statement={statementQuery.data}
            loading={statementQuery.isLoading}
            isError={statementQuery.isError}
            cleanHtml={cleanHtml}
            leetcodeUrl={problem.leetcodeUrl}
            resourceUrl={problem.resourceUrl}
          />

          {embed && (
            <details className="shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50">
                Watch tutorial (optional — try solving first)
              </summary>
              <div className="aspect-video border-t border-slate-200 dark:border-slate-800">
                <iframe
                  src={embed}
                  title="Tutorial video"
                  className="size-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </details>
          )}

          <div className="shrink-0">
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Jot down the pattern, edge cases, time/space complexity…"
              className="h-40 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Code column */}
        <div className="h-[70vh] lg:h-auto">
          <EditorPanel problemId={problem.id} leetcodeUrl={problem.leetcodeUrl} />
        </div>
      </div>
    </div>
  );
}

function StatementBlock({
  slug,
  statement,
  loading,
  isError,
  cleanHtml,
  leetcodeUrl,
  resourceUrl,
}: {
  slug?: string;
  statement?: LeetCodeStatement;
  loading: boolean;
  isError: boolean;
  cleanHtml: string;
  leetcodeUrl: string;
  resourceUrl: string;
}) {
  const card = "shrink-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

  // Concept lessons (Striver basics etc.) have no LeetCode problem.
  if (!slug) {
    return (
      <div className={card}>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Concept lesson</h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          This item teaches a concept rather than a single problem. Read the article and watch the
          tutorial, then practice in the editor.
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

  if (loading) {
    return (
      <div className={`${card} flex items-center gap-3 text-sm text-slate-500`}>
        <Spinner /> Loading problem…
      </div>
    );
  }

  if (isError || statement?.premium || !cleanHtml) {
    return (
      <div className={card}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {statement?.premium
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

  return (
    <div className={card}>
      {statement && statement.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {statement.tags.map((t) => (
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
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  );
}

function NavBtn({ to, label }: { to?: string; label: string }) {
  if (!to) {
    return (
      <span className="rounded-lg px-2.5 py-1 text-slate-300 dark:text-slate-700">{label}</span>
    );
  }
  return (
    <Link
      to={to}
      className="rounded-lg px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {label}
    </Link>
  );
}

function ResourceLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </a>
  );
}
