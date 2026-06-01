import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useLeetCodeStatement, useProblem, useProblems, useUpdateProgress } from "../lib/api";
import { leetcodeSlug } from "../lib/leetcode";
import { ProblemWorkspace } from "../components/ProblemWorkspace";
import { CenteredMessage, DifficultyBadge, EmptyState, Spinner } from "../components/ui";

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
  const storedHtml = useMemo(
    () => (problem?.statement ? DOMPurify.sanitize(problem.statement) : ""),
    [problem?.statement],
  );

  const noteTimer = useRef<ReturnType<typeof setTimeout>>();

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
  const statementHtml = cleanHtml || storedHtml;
  const embed = problem.youtubeUrl ? youtubeEmbed(problem.youtubeUrl) : null;

  const onNoteDocChange = ({ json, text }: { json: string; text: string }) => {
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      update.mutate({ problemId: problem.id, sheetId, patch: { noteDoc: json, note: text } });
    }, 700);
  };

  const idx = siblings?.findIndex((p) => p.id === problem.id) ?? -1;
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = siblings && idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {/* Breadcrumb + prev/next */}
      <div className="flex items-center justify-between gap-3 text-sm">
        <Link to={`/sheet/${sheetId}`} className="truncate text-slate-500 hover:text-indigo-600 dark:text-slate-400">
          ← {problem.unit} <span className="text-slate-300 dark:text-slate-600">/</span> {problem.chapter}
        </Link>
        <div className="flex shrink-0 gap-1">
          <NavBtn to={prev ? `/problem/${prev.id}` : undefined} label="Prev" />
          <NavBtn to={next ? `/problem/${next.id}` : undefined} label="Next" />
        </div>
      </div>

      {/* Title row */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">{problem.title}</h1>
        <DifficultyBadge value={problem.difficulty} />
        {!problem.leetcodeUrl && (
          <span
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            title="This problem isn't on LeetCode — statement provided in-app"
          >
            Not on LeetCode
          </span>
        )}
        <button
          onClick={() => update.mutate({ problemId: problem.id, sheetId, patch: { starred: !problem.starred } })}
          className={`text-2xl leading-none ${problem.starred ? "text-amber-400" : "text-slate-300 hover:text-amber-400 dark:text-slate-600"}`}
          title={problem.starred ? "Unstar" : "Star"}
        >
          {problem.starred ? "★" : "☆"}
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          {problem.leetcodeUrl && (
            <a
              href={problem.leetcodeUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
            >
              Solve on LeetCode ↗
            </a>
          )}
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

      {/* Docked workspace: Question / Solutions on the left, Code / Notes on the right */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <ProblemWorkspace
          problem={problem}
          statementHtml={statementHtml}
          statementLoading={statementQuery.isLoading && !storedHtml}
          premium={statementQuery.data?.premium}
          tags={cleanHtml ? statementQuery.data?.tags : undefined}
          embed={embed}
          solutionsUrl={solutionsUrl}
          onNoteDocChange={onNoteDocChange}
        />
      </div>
    </div>
  );
}

function NavBtn({ to, label }: { to?: string; label: string }) {
  if (!to) {
    return <span className="rounded-lg px-2.5 py-1 text-slate-300 dark:text-slate-700">{label}</span>;
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
