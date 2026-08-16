import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';
import { CATEGORY_ICONS } from '@/components/Icons';
import Sparkline from '@/components/Sparkline';

export default function DashboardGrid({ states, history }) {
  return (
    <div className="dash-grid">
      {CATEGORIES.map((c) => {
        const s = stateFor(states, c.key);
        const color = s ? LEVEL_COLORS[s.level] : 'var(--mute)';
        const levels = history ? history[c.key] : null;
        return (
          <div key={c.key} className="tile" style={{ '--tile-c': color }}>
            <div className="tile-top">
              <span className="tile-icon">{CATEGORY_ICONS[c.key]}</span>
              <span className="tile-cat">{c.label}</span>
            </div>
            <div className="tile-val">{s ? s.label : '—'}</div>
            <div className="tile-spark">
              <Sparkline levels={levels} />
            </div>
            {s?.changed_from_prior ? <div className="tile-badge">changed this run</div> : null}
          </div>
        );
      })}
    </div>
  );
}
