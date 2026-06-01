import { useEffect, useRef, useState } from "react";
import getStroke from "perfect-freehand";
import { useTheme } from "../lib/theme";

// Freehand draw canvas. Strokes are vectors (normalized 0..1 points + pressure)
// rendered with perfect-freehand, which produces a smooth, variable-width
// outline (pressure on stylus, velocity-simulated otherwise). Rendered at device
// pixel ratio so it stays crisp on retina / iPad.
type PFPoint = [number, number, number]; // x, y (0..1), pressure
interface Stroke {
  color: string | null; // null = eraser, "ink" = theme foreground
  size: number;
  points: PFPoint[];
}

const COLORS = ["ink", "#0ea5e9", "#ef4444", "#22c55e", "#eab308", "#a855f7"];
const SIZES = [3, 6, 12];

function parseStrokes(value?: string): Stroke[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function hasRealPressure(points: PFPoint[]) {
  return points.some((p) => p[2] != null && p[2] > 0 && p[2] !== 0.5);
}

export function Sketchpad({ value, onChange }: { value?: string; onChange: (json: string) => void }) {
  const { isDark } = useTheme();
  const ink = isDark ? "#e2e8f0" : "#0f172a";

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>(parseStrokes(value));
  const drawingRef = useRef(false);

  const [color, setColor] = useState<string>("ink");
  const [size, setSize] = useState<number>(6);
  const [eraser, setEraser] = useState(false);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of strokesRef.current) {
      const pts = s.points.map((p) => [p[0] * c.width, p[1] * c.height, p[2]] as PFPoint);
      const outline = getStroke(pts, {
        size: s.size * dpr,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: !hasRealPressure(s.points),
        last: !drawingRef.current,
      });
      if (outline.length < 2) continue;
      if (s.color === null) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = s.color === "ink" ? ink : s.color;
      }
      ctx.beginPath();
      ctx.moveTo(outline[0][0], outline[0][1]);
      for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i][0], outline[i][1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const c = canvasRef.current;
    if (!wrap || !c) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.max(1, wrap.clientWidth * dpr);
      c.height = Math.max(1, wrap.clientHeight * dpr);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  const pointFromEvent = (e: React.PointerEvent): PFPoint => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, e.pressure || 0.5];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push({
      color: eraser ? null : color,
      size: eraser ? size * 2.5 : size,
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
    draw();
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
    <div className="flex h-full flex-col">
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
              <span className="rounded-full bg-current" style={{ width: s, height: s }} />
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
