import { LEVEL_COLORS, fmtDate } from '@/lib/format';

// One block per published run, colored by that run's actual status level.
// Flat weeks read as same-color blocks; classification changes read as a color step.
// The latest run is full-strength; older runs are dimmed. Shows the last 12 runs.
export default function HistoryBlocks({ entries }) {
  const list = Array.isArray(entries) ? entries.slice(-12) : [];
  if (list.length < 2) return null;
  return (
    <div className="tile-hist" aria-hidden="true">
      {list.map((e, i) => (
        <span
          key={i}
          className={`hist-block${i === list.length - 1 ? ' now' : ''}`}
          style={{ background: LEVEL_COLORS[e.level] || 'var(--mute)' }}
          title={e.date ? fmtDate(e.date) : undefined}
        />
      ))}
    </div>
  );
}
