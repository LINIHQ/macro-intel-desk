import { getAllBriefs } from '@/lib/supabase';
import { CATEGORIES, LEVEL_COLORS, fmtDate, stateFor } from '@/lib/format';
import HistoryScroll from '@/components/HistoryScroll';

export const revalidate = 60;

const LEGEND = [
  { color: 'var(--g)', label: 'Supportive / normal' },
  { color: 'var(--y)', label: 'Neutral / watch' },
  { color: 'var(--o)', label: 'Tightening / elevated' },
  { color: 'var(--r)', label: 'Stressed / disruption' },
];

function weekStart(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

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

  const ticks = briefs.map(
    (b, i) => i === 0 || weekStart(b.run_date) !== weekStart(briefs[i - 1].run_date)
  );

  return (
    <div>
      <h1>Dashboard history</h1>
      <p className="page-sub">
        Each row is one category, one segment per published brief, oldest to newest. The timeline opens at the most
        recent brief; scroll left for older runs. Bright outlined segments are the briefs where a classification
        changed; dimmed segments carried over unchanged. Hover or tap any segment for that brief's date, status, and
        the reason behind a change. Date ticks mark the first brief of each week.
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
          <HistoryScroll>
            <div className="tl-grid">
              {CATEGORIES.map((c) => (
                <div key={c.key} style={{ display: 'contents' }}>
                  <span className="tl-label">{c.label}</span>
                  <div className="tl-track">
                    {briefs.map((b) => {
                      const s = stateFor(b.dashboard_states, c.key);
                      const tip = `${fmtDate(b.run_date)}: ${s ? s.label : 'n/a'}${s?.change_reason ? `. ${s.change_reason}` : ''}`;
                      return (
                        <span
                          key={b.id}
                          className={`tl-seg${s?.changed_from_prior ? ' changed' : ''}`}
                          data-tip={tip}
                          aria-label={tip}
                          style={{ background: s ? LEVEL_COLORS[s.level] : 'var(--line)' }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <span className="tl-label" />
              <div className="tl-dates">
                {briefs.map((b, i) => (
                  <span key={b.id}>{ticks[i] ? fmtDate(b.run_date).replace(/, \d{4}$/, '') : ''}</span>
                ))}
              </div>
            </div>
          </HistoryScroll>

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
