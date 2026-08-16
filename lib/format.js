export const CATEGORIES = [
  { key: 'global_liquidity', label: 'Global liquidity' },
  { key: 'yen_carry_trade', label: 'Yen carry trade' },
  { key: 'oil_shock_risk', label: 'Oil shock risk' },
  { key: 'hormuz_risk', label: 'Hormuz risk' },
  { key: 'global_risk_appetite', label: 'Risk appetite' },
  { key: 'bond_market_stress', label: 'Bond stress' },
  { key: 'xrp_fundamentals', label: 'XRP flows' },
  { key: 'xrp_macro_environment', label: 'XRP macro env' },
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

export function stateFor(states, key) {
  return (states || []).find((s) => s.category === key) || null;
}
