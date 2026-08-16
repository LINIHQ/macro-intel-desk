import { getAllBriefs } from '@/lib/supabase';
import { CATEGORIES, LEVEL_COLORS, fmtDate, stateFor } from '@/lib/format';

export const revalidate = 60;

const LEGEND = [
  { color: 'var(--g)', label: 'Supportive / normal' },
  { color: 'var(--y)', label: 'Neutral / watch' },
  { color: 'var(--o)', label: 'Tightening / elevated' },
  { color: 'var(--r)', label: 'Stressed / disruption' },
];

export default async function HistoryPage() {
  const briefs = await getAllBriefs(true);

  const changes = [];
  for (const b of briefs) {
    for (const s of b.dashboard_states || []) {
      if (s.changed_from_prior) {
        changes.push({ date: b.run_date, label: b.run_label, state: s });
      }
    }
  }
  changes.sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <h1>Dashboard history</h1>
      <p className="page-sub">
        Each row is one category, one segment per published run, oldest to newest. Bright outlined segments are the
        runs where a classification changed; dimmed segments carried over unchanged. Hover any segment for that
        run's date, status, and the reason behind a change.
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
          <div className="tl-grid">
            {CATEGORIES.map((c) => (
              <div key={c.key} style={{ display: 'contents' }}>
                <span className="tl-label">{c.label}</span>
                <div className="tl-track">
                  {briefs.map((b) => {
                    const s = stateFor(b.dashboard_states, c.key);
                    const tip = `${b.run_label} · ${fmtDate(b.run_date)}: ${s ? s.label : 'n/a'}${s?.change_reason ? `. ${s.change_reason}` : ''}`;
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
            <span />
            <div className="tl-dates">
              {briefs.map((b) => (
                <span key={b.id}>{fmtDate(b.run_date).replace(', 2026', '')}</span>
              ))}
            </div>
          </div>

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
                    <span className="mono small mute">{ch.label} · {fmtDate(ch.date)}</span>
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
