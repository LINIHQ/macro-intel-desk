import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';

export default function DashboardGrid({ states }) {
  return (
    <div className="dash-grid">
      {CATEGORIES.map((c) => {
        const s = stateFor(states, c.key);
        const color = s ? LEVEL_COLORS[s.level] : 'var(--mute)';
        return (
          <div key={c.key} className="tile" style={{ '--tile-c': color }}>
            <div className="tile-cat">{c.label}</div>
            <div className="tile-val">{s ? s.label : '—'}</div>
            {s?.changed_from_prior ? <div className="tile-chg">changed this run</div> : null}
          </div>
        );
      })}
    </div>
  );
}
