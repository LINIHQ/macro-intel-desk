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

async function fromCmc() {
  const key = process.env.CMC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest', {
      headers: { 'X-CMC_PRO_API_KEY': key },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const value = Number(json?.data?.value);
    if (!Number.isFinite(value)) return null;
    return { value, cls: json.data.value_classification || '' };
  } catch {
    return null;
  }
}

async function fromAlternative() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const row = Array.isArray(json?.data) ? json.data[0] : null;
    const value = Number(row?.value);
    if (!Number.isFinite(value)) return null;
    return { value, cls: row.value_classification || '' };
  } catch {
    return null;
  }
}

export default async function CrowdGauge() {
  const reading = (await fromCmc()) || (await fromAlternative());
  if (!reading) return null;

  const { value, cls } = reading;
  const color = colorFor(value);
  const [mx, my] = pt(Math.min(99, Math.max(1, value)));

  return (
    <div className="fng">
      <div className="fng-label">Crypto Market Fear &amp; Greed</div>
      <div className="fng-row">
        <svg
          className="fng-svg"
          viewBox="0 0 100 60"
          role="img"
          aria-label={`Crypto market fear and greed: ${value}, ${cls}`}
        >
          {BANDS.map((b) => (
            <path
              key={b.from}
              d={arc(b.from, b.to)}
              stroke={b.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          ))}
          <circle cx={mx.toFixed(2)} cy={my.toFixed(2)} r="5" fill="var(--text)" stroke="var(--bg)" strokeWidth="2" />
        </svg>
        <div className="fng-read">
          <span className="fng-num">{value}</span>
          <span className="fng-class" style={{ color }}>{cls}</span>
        </div>
      </div>
    </div>
  );
}
