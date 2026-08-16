const R = 40;
const CX = 50;
const CY = 52;

function pt(v, r = R) {
  const a = (Math.PI * (180 - v * 1.8)) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}

function arc(v1, v2) {
  const [x1, y1] = pt(v1);
  const [x2, y2] = pt(v2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const BANDS = [
  { from: 1, to: 23, color: 'var(--r)' },
  { from: 27, to: 43, color: 'var(--o)' },
  { from: 47, to: 53, color: 'var(--y)' },
  { from: 57, to: 99, color: 'var(--g)' },
];

function colorFor(v) {
  if (v <= 24) return 'var(--r)';
  if (v <= 44) return 'var(--o)';
  if (v <= 55) return 'var(--y)';
  return 'var(--g)';
}

async function getFng() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=8', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data) && json.data.length ? json.data : null;
  } catch {
    return null;
  }
}

export default async function CrowdGauge() {
  const data = await getFng();
  if (!data) return null;

  const value = Number(data[0].value);
  if (!Number.isFinite(value)) return null;

  const cls = data[0].value_classification || '';
  const prev = data[1] ? Number(data[1].value) : null;
  const week = data[7] ? Number(data[7].value) : null;
  const color = colorFor(value);
  const [mx, my] = pt(Math.min(99, Math.max(1, value)));

  return (
    <div className="gauge-box">
      <svg
        className="gauge-svg"
        viewBox="0 0 100 60"
        role="img"
        aria-label={`Crypto Fear and Greed Index: ${value}, ${cls}`}
      >
        {BANDS.map((b) => (
          <path
            key={b.from}
            d={arc(b.from, b.to)}
            stroke={b.color}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        <circle cx={mx.toFixed(2)} cy={my.toFixed(2)} r="4.5" fill="var(--text)" stroke="var(--bg)" strokeWidth="2" />
      </svg>
      <div>
        <div className="gauge-num">{value}</div>
        <div className="gauge-class" style={{ color }}>{cls}</div>
      </div>
      <div className="gauge-meta">
        <div className="gauge-label">Crowd Pulse</div>
        <div className="gauge-hist">
          {prev != null && Number.isFinite(prev) ? `24h ago ${prev}` : ''}
          {prev != null && week != null && Number.isFinite(week) ? ' \u00b7 ' : ''}
          {week != null && Number.isFinite(week) ? `7d ago ${week}` : ''}
        </div>
        <div className="gauge-attr">Crypto Fear &amp; Greed Index \u00b7 alternative.me</div>
      </div>
    </div>
  );
}
