import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';
import { CATEGORY_ICONS } from '@/components/Icons';
import TrendLine from '@/components/TrendLine';

// Risk gauges: higher level means more risk, so the line points UP when hot.
// Condition gauges: higher level means worse conditions, so the line points DOWN when bad.
const RISK_KEYS = new Set(['yen_carry_trade', 'oil_shock_risk', 'hormuz_risk', 'bond_market_stress']);

function directionFor(key, level) {
  if (level == null) return 'flat';
  if (RISK_KEYS.has(key)) {
    return level >= 3 ? 'up' : 'flat';
  }
  if (level === 1) return 'up';
  if (level >= 3) return 'down';
  return 'flat';
}

export default function DashboardGrid({ states }) {
  return (
    <div className="dash-grid">
      {CATEGORIES.map((c) => {
        const s = stateFor(states, c.key);
        const color = s ? LEVEL_COLORS[s.level] : 'var(--mute)';
        const direction = directionFor(c.key, s?.level ?? null);
        return (
          <div key={c.key} className="tile" style={{ '--tile-c': color }}>
            <div className="tile-top">
              <span className="tile-icon">{CATEGORY_ICONS[c.key]}</span>
              <span className="tile-cat">{c.label}</span>
            </div>
            <div className="tile-mid">
              <div className="tile-val">{s ? s.label : '—'}</div>
              <TrendLine direction={direction} seedKey={c.key} />
            </div>
            {s?.changed_from_prior ? <div className="tile-badge">changed this run</div> : null}
          </div>
        );
      })}
    </div>
  );
}
