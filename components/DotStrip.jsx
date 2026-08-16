import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';

export default function DotStrip({ states }) {
  return (
    <div className="dots" aria-hidden="true">
      {CATEGORIES.map((c) => {
        const s = stateFor(states, c.key);
        return (
          <span
            key={c.key}
            className="dot"
            title={`${c.label}: ${s ? s.label : 'n/a'}`}
            style={{ background: s ? LEVEL_COLORS[s.level] : 'var(--line)' }}
          />
        );
      })}
    </div>
  );
}
