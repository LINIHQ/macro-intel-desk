// Stylized trend motif for dashboard tiles.
// The SLOPE is real: 'up' = classification improved/eased since the prior run,
// 'down' = worsened, 'flat' = held. The jaggedness is decorative texture only
// (deterministic per category so it doesn't shift between renders).
function hashStr(str) {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) || 1;
}

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export default function TrendLine({ direction = 'flat', seedKey = 'x' }) {
  const w = 60;
  const h = 24;
  const n = 12;
  const pad = 2;
  const rand = rng(hashStr(seedKey + direction));
  const y0 = direction === 'up' ? h - 6 : direction === 'down' ? 6 : h / 2;
  const y1 = direction === 'up' ? 6 : direction === 'down' ? h - 6 : h / 2;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = y0 + (y1 - y0) * t;
    const damp = i === 0 || i === n - 1 ? 0.3 : 1;
    const wig = (rand() - 0.5) * 7 * damp;
    const y = Math.min(h - 2, Math.max(2, base + wig));
    pts.push(`${(pad + t * (w - 2 * pad)).toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg className="trend" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
