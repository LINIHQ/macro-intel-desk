// Plots a category's actual level history (1=green .. 4=red) across published runs.
// Higher stress plots higher. Renders nothing until at least 2 runs exist.
export default function Sparkline({ levels }) {
  const pts = (levels || []).filter(Number.isFinite);
  if (pts.length < 2) return null;
  const w = 64;
  const h = 22;
  const pad = 3;
  const step = (w - pad * 2) / (pts.length - 1);
  const y = (lv) => pad + (4 - lv) * ((h - pad * 2) / 3);
  const d = pts.map((lv, i) => `${(pad + i * step).toFixed(1)},${y(lv).toFixed(1)}`).join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
