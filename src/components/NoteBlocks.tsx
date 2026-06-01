import { useEffect, useRef, useState } from "react";
import { Sketchpad } from "./Sketchpad";

// A block-based note: text and drawing blocks interleaved in one document.
// Persisted as JSON (`noteDoc`); the parent also derives plain text (from the
// text blocks) into `note` for the revision view / search.
type Block =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "draw"; strokes: string };

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

function seed(docValue?: string, noteText?: string): Block[] {
  if (docValue) {
    try {
      const parsed = JSON.parse(docValue);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* fall through */
    }
  }
  return [{ id: uid(), type: "text", text: noteText || "" }];
}

function AutoText({
  value,
  onChange,
  onFocus,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };
  useEffect(resize, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      onFocus={onFocus}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none border-0 bg-transparent text-sm leading-relaxed outline-none antialiased"
    />
  );
}

export function NoteBlocks({
  docValue,
  noteText,
  onChange,
}: {
  docValue?: string;
  noteText?: string;
  onChange: (doc: { json: string; text: string }) => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>(() => seed(docValue, noteText));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const commit = (next: Block[]) => {
    setBlocks(next);
    const json = JSON.stringify(next);
    const text = next
      .filter((b): b is Extract<Block, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();
    onChange({ json, text });
  };

  const updateText = (id: string, text: string) =>
    commit(blocks.map((b) => (b.id === id && b.type === "text" ? { ...b, text } : b)));
  const updateDraw = (id: string, strokes: string) =>
    commit(blocks.map((b) => (b.id === id && b.type === "draw" ? { ...b, strokes } : b)));
  const addBlock = (type: Block["type"]) =>
    commit([
      ...blocks,
      type === "text" ? { id: uid(), type, text: "" } : { id: uid(), type, strokes: "" },
    ]);
  const removeBlock = (id: string) => commit(blocks.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  const ctrlBtn =
    "grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300";

  return (
    <div className="flex h-full flex-col">
      <div
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      >
        {blocks.map((b, i) => {
          const selected = selectedId === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`relative rounded-lg px-2 py-1.5 transition-colors ${
                selected ? "bg-slate-50 ring-1 ring-indigo-300 dark:bg-slate-800/50 dark:ring-indigo-500/40" : ""
              }`}
            >
              {selected && (
                <div className="absolute right-1 top-1 z-10 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white/95 p-0.5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
                  <button className={ctrlBtn} title="Move up" onClick={() => move(b.id, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button
                    className={ctrlBtn}
                    title="Move down"
                    onClick={() => move(b.id, 1)}
                    disabled={i === blocks.length - 1}
                  >
                    ↓
                  </button>
                  <button className={ctrlBtn} title="Delete block" onClick={() => removeBlock(b.id)}>
                    ✕
                  </button>
                </div>
              )}
              {b.type === "text" ? (
                <AutoText
                  value={b.text}
                  onChange={(t) => updateText(b.id, t)}
                  onFocus={() => setSelectedId(b.id)}
                  placeholder="Write your thoughts — patterns, edge cases, complexity…"
                />
              ) : (
                <div
                  className={`overflow-hidden rounded-lg border ${
                    selected ? "h-64 border-slate-200 dark:border-slate-700" : "h-48 border-slate-200/70 dark:border-slate-800"
                  }`}
                >
                  <Sketchpad value={b.strokes} onChange={(s) => updateDraw(b.id, s)} readOnly={!selected} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-200 px-2 py-1.5 dark:border-slate-800">
        <button
          onClick={() => addBlock("text")}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Text
        </button>
        <button
          onClick={() => addBlock("draw")}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Drawing
        </button>
      </div>
    </div>
  );
}
