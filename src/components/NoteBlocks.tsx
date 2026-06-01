import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Sketchpad } from "./Sketchpad";

function renderMd(text: string): string {
  return DOMPurify.sanitize(marked.parse(text, { breaks: true, async: false }) as string);
}

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
  onEnter,
  onBackspaceEmpty,
  autoFocus,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
  autoFocus?: boolean;
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
  useEffect(() => {
    if (autoFocus && ref.current) {
      const el = ref.current;
      el.focus();
      const n = el.value.length;
      el.setSelectionRange(n, n);
    }
  }, [autoFocus]);

  // Wrap the selection (or caret) with a markdown marker, e.g. ** for bold.
  const wrap = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const next = value.slice(0, s) + marker + value.slice(s, e) + marker + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.focus();
      ref.current.setSelectionRange(s + marker.length, e + marker.length);
    });
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = ev.metaKey || ev.ctrlKey;
    const k = ev.key.toLowerCase();
    if (mod && k === "b") return ev.preventDefault(), wrap("**");
    if (mod && k === "i") return ev.preventDefault(), wrap("*");
    if (mod && k === "e") return ev.preventDefault(), wrap("`");
    if (ev.key === "Enter" && !ev.shiftKey) return ev.preventDefault(), onEnter?.();
    if (ev.key === "Backspace" && value === "") return ev.preventDefault(), onBackspaceEmpty?.();
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none border-0 bg-transparent font-mono text-sm leading-relaxed outline-none antialiased"
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
  const [slashId, setSlashId] = useState<string | null>(null); // block showing the "/" menu
  const [focusId, setFocusId] = useState<string | null>(null); // text block to focus next

  // Make the first empty text block editable on open (no focus-steal).
  useEffect(() => {
    if (blocks.length === 1 && blocks[0].type === "text") setSelectedId(blocks[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateText = (id: string, text: string) => {
    commit(blocks.map((b) => (b.id === id && b.type === "text" ? { ...b, text } : b)));
    // Typing "/" on an (otherwise empty) block opens the insert menu.
    if (text === "/") setSlashId(id);
    else if (slashId === id) setSlashId(null);
  };
  // Insert a block via the "/" menu: clears the slash and adds the chosen type.
  const insertViaSlash = (id: string, type: Block["type"]) => {
    setSlashId(null);
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    let next: Block[] = blocks.map((b) =>
      b.id === id && b.type === "text" ? { ...b, text: "" } : b,
    );
    if (type === "draw") {
      const drawBlock: Block = { id: uid(), type: "draw", strokes: "" };
      next = [...next.slice(0, i + 1), drawBlock, ...next.slice(i + 1)];
      const last = next[next.length - 1];
      if (last.type !== "text") next = [...next, { id: uid(), type: "text", text: "" }];
      setSelectedId(drawBlock.id);
    } else {
      const textBlock: Block = { id: uid(), type: "text", text: "" };
      next = [...next.slice(0, i + 1), textBlock, ...next.slice(i + 1)];
      setSelectedId(textBlock.id);
    }
    commit(next);
  };
  const updateDraw = (id: string, strokes: string) =>
    commit(blocks.map((b) => (b.id === id && b.type === "draw" ? { ...b, strokes } : b)));
  const addBlock = (type: Block["type"]) =>
    commit([
      ...blocks,
      type === "text" ? { id: uid(), type, text: "" } : { id: uid(), type, strokes: "" },
    ]);
  const removeBlock = (id: string) => commit(blocks.filter((b) => b.id !== id));
  // Enter at the end of a text block -> new text block below (and focus it).
  const addAfter = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    const nb: Block = { id: uid(), type: "text", text: "" };
    setSlashId(null);
    setSelectedId(nb.id);
    setFocusId(nb.id);
    commit([...blocks.slice(0, i + 1), nb, ...blocks.slice(i + 1)]);
  };
  // Backspace on an empty block -> delete it and focus the previous block.
  const removeAndFocusPrev = (id: string) => {
    if (blocks.length <= 1) return;
    const i = blocks.findIndex((b) => b.id === id);
    const neighbour = blocks[i - 1] ?? blocks[i + 1];
    setSlashId(null);
    if (neighbour) {
      setSelectedId(neighbour.id);
      if (neighbour.type === "text") setFocusId(neighbour.id);
    }
    commit(blocks.filter((b) => b.id !== id));
  };
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
          if (e.target === e.currentTarget) {
            setSelectedId(null);
            setSlashId(null);
          }
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
                selected ? (
                <>
                  <AutoText
                    value={b.text}
                    onChange={(t) => updateText(b.id, t)}
                    onFocus={() => setSelectedId(b.id)}
                    onEnter={() => addAfter(b.id)}
                    onBackspaceEmpty={() => removeAndFocusPrev(b.id)}
                    autoFocus={focusId === b.id}
                    placeholder="Write, or type / to add a block…"
                  />
                  {slashId === b.id && (
                    <div className="absolute left-2 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                      <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400">Add block</p>
                      <button
                        onClick={() => insertViaSlash(b.id, "text")}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        ¶ Text
                      </button>
                      <button
                        onClick={() => insertViaSlash(b.id, "draw")}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        ✎ Drawing
                      </button>
                    </div>
                  )}
                </>
                ) : (
                  <div
                    onClick={() => {
                      setSelectedId(b.id);
                      setFocusId(b.id);
                    }}
                    className="md-rich cursor-text text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    {b.text.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMd(b.text) }} />
                    ) : (
                      <span className="text-slate-400">Empty — click to write, or / for blocks</span>
                    )}
                  </div>
                )
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
