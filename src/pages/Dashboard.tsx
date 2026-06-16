import { Link } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useSheets } from "../lib/api";
import { CenteredMessage, EmptyState, ProgressRing, Spinner } from "../components/ui";

function resumeTarget(): { id: string; title: string; sheetId: string } | null {
  try {
    const raw = localStorage.getItem("dsa-last");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { user } = useUser();
  const { data: sheets, isLoading, isError } = useSheets();

  if (isLoading) {
    return (
      <CenteredMessage>
        <Spinner />
      </CenteredMessage>
    );
  }
  if (isError) {
    return <EmptyState title="Couldn't load your tracks" hint="Check your connection and try again." />;
  }
  if (!sheets || sheets.length === 0) {
    return <EmptyState title="No sheets yet" hint="Run the migration to load the curated content." />;
  }

  const total = sheets.reduce((acc, s) => acc + s.total, 0);
  const done = sheets.reduce((acc, s) => acc + s.done, 0);
  const overall = total ? (done / total) * 100 : 0;
  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back";
  const last = resumeTarget();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <ProgressRing value={overall} size={104} stroke={10} />
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500 dark:text-slate-400">{greeting}</p>
          <h1 className="mt-1 text-2xl font-bold">
            {done} <span className="text-slate-400">/ {total} solved</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Keep going — small daily reps beat marathons.
          </p>
        </div>
      </section>

      {last && (
        <Link
          to={`/problem/${last.id}`}
          className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
        >
          <span className="rounded-md bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white">
            Resume
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-indigo-800 dark:text-indigo-200">
            {last.title}
          </span>
          <span className="text-indigo-400">→</span>
        </Link>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Your tracks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sheets.map((s) => {
            const pct = s.total ? (s.done / s.total) * 100 : 0;
            return (
              <Link
                key={s.id}
                to={`/sheet/${s.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
              >
                <ProgressRing value={pct} />
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {s.label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {s.done} of {s.total} solved
                  </p>
                </div>
                <span className="ml-auto text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
