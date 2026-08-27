import { getAllBriefs } from '@/lib/supabase';
import { CATEGORIES, LEVEL_COLORS, fmtDate, fmtDateShort, stateFor } from '@/lib/format';
import HistoryTimeline from '@/components/HistoryTimeline';

export const revalidate = 60;

const LEGEND = [
  { color: 'var(--g)', label: 'Supportive / normal' },
  { color: 'var(--y)', label: 'Neutral / watch' },
  { color: 'var(--o)', label: 'Tightening / elevated' },
  { color: 'var(--r)', label: 'Stressed / disruption' },
];

// Ticks read as a steady ruler, one label every other segment, rather than marking
// calendar-week boundaries. Publishing cadence has changed over time (four briefs a
// week before Aug 20, five after, plus week-ending summaries landing on top of a
// Friday), so week-start ticks land at uneven visual spacing even though the logic
// is correct. Evenly-spaced ticks avoid that regardless of how cadence shifts again.
const TICK_INTERVAL = 2;

export default async function HistoryPage() {
  const briefs = await getAllBriefs(true);

  const changes = [];
  for (const b of briefs) {
    for (const s of b.dashboard_states || []) {
      if (s.changed_from_prior) {
        changes.push({ date: b.run_date, state: s });
      }
    }
  }
  changes.sort((a, b) => (a.date < b.date ? 1 : -1));

  const rows = CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    segs: briefs.map((b) => {
      const s = stateFor(b.dashboard_states, c.key);
      const date = fmtDate(b.run_date);
      const status = s ? s.label : 'n/a';
      const reason = s?.change_reason || '';
      const trendBit = s?.trend && s?.trend_note ? ` Trend (${s.trend}): ${s.trend_note}` : '';
      return {
        id: b.id,
        date,
        status,
        reason,
        changed: !!s?.changed_from_prior,
        color: s ? LEVEL_COLORS[s.level] : 'var(--line)',
        tip: `${date}: ${status}${reason ? `. ${reason}` : ''}${trendBit}`,
      };
    }),
  }));

  // Anchor the interval at the newest brief (the timeline opens scrolled to the right),
  // so a tick always lands on the most recent segment rather than drifting off it.
  const lastIdx = briefs.length - 1;
  const dates = briefs.map((b, i) =>
    (lastIdx - i) % TICK_INTERVAL === 0 ? fmtDateShort(b.run_date) : ''
  );

  return (
    <div>
      <h1>Dashboard history</h1>
      <p className="page-sub">
        Each row is one category, one segment per published brief, oldest to newest. The timeline opens at the most
        recent brief; scroll left for older runs. Bright outlined segments are the briefs where a classification
        changed; dimmed segments carried over unchanged. Tap or hover any segment for that brief's date, status, and
        the reason behind a change. Date ticks appear every other brief for a steady read across the timeline.
      </p>
      <div className="legend">
        {LEGEND.map((l) => (
          <span key={l.label}>
            <span className="dot" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {briefs.length ? (
        <>
          <HistoryTimeline rows={rows} dates={dates} />

          {changes.length ? (
            <>
              <h2>Classification changes</h2>
              <div className="row-list">
                {changes.map((ch, i) => (
                  <div key={i} className="row-item">
                    <span>
                      <span className="mono small" style={{ color: LEVEL_COLORS[ch.state.level] }}>
                        {CATEGORIES.find((c) => c.key === ch.state.category)?.label} → {ch.state.label}
                      </span>
                      <br />
                      <span className="small dim">{ch.state.change_reason || 'No reason recorded.'}</span>
                    </span>
                    <span className="mono small mute">{fmtDate(ch.date)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div className="empty">No published briefs yet.</div>
      )}
    </div>
  );
}
