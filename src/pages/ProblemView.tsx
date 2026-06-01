import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProblem, useProblems, useUpdateProgress } from "../lib/api";
import { EditorPanel } from "../components/EditorPanel";
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

  const [note, setNote] = useState("");
  const noteTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setNote(problem?.note ?? "");
  }, [problem?.id, problem?.note]);

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
        <button
          onClick={() => update.mutate({ problemId: problem.id, sheetId, patch: { done: !problem.done } })}
          className={`ml-auto rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            problem.done
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-indigo-500 text-white hover:bg-indigo-600"
          }`}
        >
          {problem.done ? "✓ Solved" : "Mark as solved"}
        </button>
      </div>

      {/* Resource links */}
      <div className="flex flex-wrap gap-2">
        {problem.leetcodeUrl && (
          <ResourceLink href={problem.leetcodeUrl} className="bg-amber-500 text-white hover:bg-amber-600">
            Open on LeetCode ↗
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

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Learn column */}
        <div className="space-y-5">
          {embed && (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="aspect-video">
                <iframe
                  src={embed}
                  title="Tutorial video"
                  className="size-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          <div>
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
        <div className="h-[60vh] lg:sticky lg:top-20 lg:h-[calc(100vh-10rem)]">
          <EditorPanel problemId={problem.id} />
        </div>
      </div>
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
