import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRevision, useUpdateProgress } from "../lib/api";
import { CenteredMessage, DifficultyBadge, EmptyState, Spinner } from "../components/ui";

export default function Revision() {
  const { data: items, isLoading, isError } = useRevision();
  const update = useUpdateProgress();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(q) || i.note.toLowerCase().includes(q),
    );
  }, [items, query]);

  if (isLoading) {
    return (
      <CenteredMessage>
        <Spinner />
      </CenteredMessage>
    );
  }
  if (isError) {
    return <EmptyState title="Couldn't load revision items" hint="Try refreshing the page." />;
  }
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="Nothing to revise yet"
        hint="Star problems or add notes and they'll collect here."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Revision</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">{items.length} items</span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search starred problems and notes…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"
      />

      {filtered.length === 0 ? (
        <EmptyState title="No matches" hint="Try a different search." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((i) => (
            <div
              key={i.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start gap-2">
                <Link
                  to={`/problem/${i.id}`}
                  className="min-w-0 flex-1 font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {i.title}
                </Link>
                <button
                  onClick={() =>
                    update.mutate({ problemId: i.id, sheetId: i.sheetId, patch: { starred: !i.starred } })
                  }
                  className={`text-lg leading-none ${i.starred ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                  title={i.starred ? "Unstar" : "Star"}
                >
                  {i.starred ? "★" : "☆"}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <DifficultyBadge value={i.difficulty} />
                <span className="truncate">{i.unit}</span>
              </div>
              {i.note && (
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                  {i.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
