export const CATEGORIES = [
  { key: 'global_liquidity', label: 'Global liquidity' },
  // Sept 24, 2026 (v1.1.1): display label renamed from "Yen carry trade" so the
  // audience's term for an unwind (reverse carry trade, RCT) appears on the tile.
  // Key unchanged, so history, the criterion register and analytics carry over.
  { key: 'yen_carry_trade', label: 'Yen carry / RCT' },
  { key: 'oil_shock_risk', label: 'Oil shock risk' },
  { key: 'hormuz_risk', label: 'Hormuz risk' },
  { key: 'global_risk_appetite', label: 'Risk appetite' },
  { key: 'bond_market_stress', label: 'Bond stress' },
  { key: 'xrp_fundamentals', label: 'XRP flows' },
  { key: 'xrp_macro_environment', label: 'Macro backdrop' },
];

export const LEVEL_COLORS = {
  1: 'var(--g)',
  2: 'var(--y)',
  3: 'var(--o)',
  4: 'var(--r)',
};

export const VERIFICATION = {
  verified: { label: 'Verified', color: 'var(--g)' },
  partially_verified: { label: 'Partially verified', color: 'var(--y)' },
  unverified: { label: 'Unverified', color: 'var(--o)' },
  contradicted: { label: 'Contradicted', color: 'var(--r)' },
  opinion: { label: 'Opinion', color: 'var(--dim)' },
};

export const IMPORTANCE = {
  critical: { label: 'Critical', color: 'var(--r)' },
  high: { label: 'High', color: 'var(--o)' },
  medium: { label: 'Medium', color: 'var(--y)' },
  low: { label: 'Low', color: 'var(--dim)' },
};

export const WATCH_STATUS = {
  open: { label: 'Open', color: 'var(--g)' },
  escalated: { label: 'Escalated', color: 'var(--o)' },
  resolved: { label: 'Resolved', color: 'var(--dim)' },
};

export function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Compact numeric date for tight spaces, e.g. the history timeline's week ticks.
// "8/11" instead of "Aug 11": narrower, and reads cleaner spaced out along an axis.
export function fmtDateShort(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

// Run timestamp in ET, taken from the brief's created_at (the actual write time).
// When the write happened on the same ET date the brief is dated for, show the time
// alone, since the date is already on the dateline next to it. When it did not, show
// the date too: week-ending summaries are dated by the Friday they cover but written
// Saturday, and a bare Saturday clock time under a Friday date would misread.
export function fmtRunStamp(createdAt, runDate) {
  if (!createdAt) return '';
  const dt = new Date(createdAt);
  if (Number.isNaN(dt.getTime())) return '';
  const tz = { timeZone: 'America/New_York' };
  const time = dt.toLocaleTimeString('en-US', { ...tz, hour: 'numeric', minute: '2-digit' });
  const etDate = dt.toLocaleDateString('en-CA', tz);
  if (runDate && etDate !== runDate) {
    const day = dt.toLocaleDateString('en-US', { ...tz, month: 'short', day: 'numeric' });
    return `${day}, ${time} ET`;
  }
  return `${time} ET`;
}

// Absolute date and time in ET for a full timestamp, always showing both parts.
//
// Added Sept 14, 2026 for the claims page freshness stamp. Deliberately not
// fmtRunStamp: that one drops the date when it matches the brief's dateline,
// which is right there because the date sits next to it. A freshness stamp has
// no dateline beside it, and a bare clock time is exactly the case where a
// reader cannot tell an hour old from a day old.
//
// Also deliberately absolute rather than relative ("4 minutes ago"). Relative
// time has to be computed in the browser to stay honest, and on a statically
// rendered page a server-computed "4 minutes ago" freezes into the HTML and is
// a lie the moment it is cached.
export function fmtStampET(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const tz = { timeZone: 'America/New_York' };
  const day = dt.toLocaleDateString('en-US', { ...tz, month: 'short', day: 'numeric' });
  const time = dt.toLocaleTimeString('en-US', { ...tz, hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time} ET`;
}

export function stateFor(states, key) {
  return (states || []).find((s) => s.category === key) || null;
}
