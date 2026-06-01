import { useEffect, useRef, useState } from "react";
import { useTheme } from "../lib/theme";

// A small freehand scratchpad. Strokes are stored as vectors (normalized 0..1
// coordinates) so they're compact, crisp at any size, and undoable. The pen
// color "ink" renders with the current theme so sketches stay visible in both
// light and dark mode.
interface Point {
  x: number;
  y: number;
}
interface Stroke {
  color: string | null; // null = eraser, "ink" = theme foreground
  size: number;
  points: Point[];
}

const COLORS = ["ink", "#0ea5e9", "#ef4444", "#22c55e", "#eab308", "#a855f7"];
const SIZES = [2, 4, 8];

function parseStrokes(value?: string): Stroke[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function Sketchpad({ value, onChange }: { value?: string; onChange: (json: string) => void }) {
  const { isDark } = useTheme();
  const ink = isDark ? "#e2e8f0" : "#0f172a";

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>(parseStrokes(value));
  const drawingRef = useRef(false);

  const [color, setColor] = useState<string>("ink");
  const [size, setSize] = useState<number>(4);
  const [eraser, setEraser] = useState(false);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const s of strokesRef.current) {
      if (s.color === null) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = s.color === "ink" ? ink : s.color;
      }
      ctx.lineWidth = s.size;
      ctx.beginPath();
      s.points.forEach((p, i) => {
        const x = p.x * c.width;
        const y = p.y * c.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      if (s.points.length === 1) {
        const p = s.points[0];
        ctx.arc(p.x * c.width, p.y * c.height, s.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle as string;
        ctx.fill();
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  // Size the canvas to its container and redraw on resize / theme change.
  useEffect(() => {
    const wrap = wrapRef.current;
    const c = canvasRef.current;
    if (!wrap || !c) return;
    const fit = () => {
      c.width = wrap.clientWidth;
      c.height = wrap.clientHeight;
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  const pointFromEvent = (e: React.PointerEvent): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push({
      color: eraser ? null : color,
      size: eraser ? size * 3 : size,
      points: [pointFromEvent(e)],
    });
    draw();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    strokesRef.current[strokesRef.current.length - 1].points.push(pointFromEvent(e));
    draw();
  };
  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(strokesRef.current.length ? JSON.stringify(strokesRef.current) : "");
  };

  const undo = () => {
    strokesRef.current.pop();
    draw();
    onChange(strokesRef.current.length ? JSON.stringify(strokesRef.current) : "");
    rerender();
  };
  const clear = () => {
    strokesRef.current = [];
    draw();
    onChange("");
    rerender();
  };

  const swatchRing = (active: boolean) =>
    active ? "ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900" : "ring-1 ring-slate-300 dark:ring-slate-700";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-2 py-1.5 dark:border-slate-800">
        <div className="flex items-center gap-1">
          {COLORS.map((cVal) => (
            <button
              key={cVal}
              onClick={() => {
                setColor(cVal);
                setEraser(false);
              }}
              className={`size-5 rounded-full ${swatchRing(!eraser && color === cVal)}`}
              style={{ background: cVal === "ink" ? ink : cVal }}
              title={cVal === "ink" ? "Default ink" : cVal}
            />
          ))}
        </div>
        <div className="ml-1 flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`grid size-6 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                size === s ? "bg-slate-100 dark:bg-slate-800" : ""
              }`}
              title={`Pen size ${s}`}
            >
              <span className="rounded-full bg-current" style={{ width: s + 2, height: s + 2 }} />
            </button>
          ))}
        </div>
        <button
          onClick={() => setEraser((v) => !v)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            eraser
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          Eraser
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={undo}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Undo
          </button>
          <button
            onClick={clear}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Clear
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="block size-full touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
    </div>
  );
}
