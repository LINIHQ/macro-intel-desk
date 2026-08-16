import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';
import { CATEGORY_ICONS } from '@/components/Icons';
import TrendLine from '@/components/TrendLine';

export default function DashboardGrid({ states, history }) {
  return (
    <div className="dash-grid">
      {CATEGORIES.map((c) => {
        const s = stateFor(states, c.key);
        const color = s ? LEVEL_COLORS[s.level] : 'var(--mute)';
        const entries = (history && history[c.key]) || [];
        const prev = entries.length > 1 ? entries[entries.length - 2].level : null;
        const curr = s?.level ?? (entries.length ? entries[entries.length - 1].level : null);
        let direction = 'flat';
        if (prev != null && curr != null) {
          if (curr < prev) direction = 'up';
          else if (curr > prev) direction = 'down';
        }
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
