import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';

const ABBREV = {
  global_liquidity: 'LIQ',
  yen_carry_trade: 'YEN',
  oil_shock_risk: 'OIL',
  hormuz_risk: 'HRMZ',
  global_risk_appetite: 'RISK',
  bond_market_stress: 'BOND',
  xrp_fundamentals: 'FLOW',
  xrp_macro_environment: 'MACRO',
};

export default function DotStrip({ states, labeled = false }) {
  return (
    <div className="dots" aria-hidden="true">
      {CATEGORIES.map((c) => {
        const s = stateFor(states, c.key);
        const dot = (
          <span
            className="dot"
            style={{ background: s ? LEVEL_COLORS[s.level] : 'var(--line)' }}
          />
        );
        if (!labeled) {
          return (
            <span key={c.key} title={`${c.label}: ${s ? s.label : 'n/a'}`}>
              {dot}
            </span>
          );
        }
        return (
          <span
            key={c.key}
            title={`${c.label}: ${s ? s.label : 'n/a'}`}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {dot}
            <span
              className="mono"
              style={{ fontSize: 8, letterSpacing: '0.04em', opacity: 0.55, lineHeight: 1 }}
            >
              {ABBREV[c.key] || ''}
            </span>
          </span>
        );
      })}
    </div>
  );
}
