import Link from 'next/link';
import { getCriteriaRegister, getDeskConfig } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/format';

export const revalidate = 60;

export const metadata = {
  title: 'Criterion register',
  description:
    'Every pre-registered gauge movement criterion the desk has published, with its revisions, effective dates and reasons.',
};

function fmtDay(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function CriterionRow({ row }) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${row.is_current ? 'var(--fg, currentColor)' : 'rgba(255,255,255,0.18)'}`,
        paddingLeft: 12,
        margin: '0 0 16px',
        opacity: row.is_current ? 1 : 0.82,
      }}
    >
      <div className="small" style={{ letterSpacing: '0.04em', marginBottom: 4 }}>
        <strong>{row.direction === 'worsen' ? 'WORSENS' : 'IMPROVES'}</strong>
        {row.is_current ? (
          <span> · in force since {fmtDay(row.effective_date)}</span>
        ) : (
          <span className="mute">
            {' '}
            · in force {fmtDay(row.effective_date)} to {fmtDay(row.superseded_date)}
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 6px' }}>{row.criterion_md}</p>
      {row.change_reason ? (
        <p className="small mute" style={{ margin: 0 }}>
          {row.is_current ? 'Why this test: ' : 'Why it was replaced: '}
          {row.change_reason}
        </p>
      ) : null}
      {row.methodology_version ? (
        <p className="small mute" style={{ margin: '4px 0 0' }}>
          Methodology {row.methodology_version}
        </p>
      ) : null}
    </div>
  );
}

export default async function MethodologyPage() {
  const [rows, config] = await Promise.all([
    getCriteriaRegister(),
    getDeskConfig(['methodology_version', 'methodology_changelog']),
  ]);

  const byCat = {};
  for (const r of rows) {
    if (!byCat[r.category]) byCat[r.category] = [];
    byCat[r.category].push(r);
  }
  for (const k of Object.keys(byCat)) {
    byCat[k].sort((a, b) => {
      if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
      if (a.direction !== b.direction) return a.direction === 'worsen' ? -1 : 1;
      return String(b.effective_date).localeCompare(String(a.effective_date));
    });
  }

  const changelog = (config.methodology_changelog || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const covered = CATEGORIES.filter((c) => byCat[c.key]?.length);
  const uncovered = CATEGORIES.filter((c) => !byCat[c.key]?.length);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Criterion register</h1>
          <p className="page-meta">
            Methodology {config.methodology_version || 'unversioned'} · {rows.length} recorded criteria
          </p>
        </div>
      </div>

      <p>
        Each dashboard gauge carries pre-registered movement criteria: the specific, checkable
        evidence that would move it one level worse or one level better. This page holds every
        criterion the desk has published, current and retired, with the wording it replaced, the date
        it took effect, the brief it took effect in, and the reason it changed.
      </p>
      <p>
        It exists because a pre-registered test is only worth something if readers can see when it
        was rewritten. Before Sept 8, 2026 the desk recorded why a classification moved but not when
        a criterion changed while the classification held, which meant a stable-looking gauge could
        be sitting behind a test that had quietly been replaced. Rows dated before Sept 8, 2026 were
        reconstructed from published brief text. Where the reason for a revision was not recorded at
        the time, the row says exactly that rather than supplying one after the fact.
      </p>
      <p className="small mute">
        Criteria are never edited in place. A revision inserts a new row and stamps the row it
        replaces. Movement criteria are published for gauges at orange or red and for any gauge with
        a live trigger. For how classifications and verdicts are defined, see{' '}
        <Link href="/sources">sources and methodology</Link>. For the classifications themselves over
        time, see the <Link href="/history">history page</Link>.
      </p>

      {covered.map((c) => (
        <section key={c.key} style={{ margin: '30px 0 0' }}>
          <h2 style={{ marginBottom: 4 }}>{c.label}</h2>
          <p className="small mute" style={{ margin: '0 0 12px' }}>
            {byCat[c.key].filter((r) => r.is_current).length} in force ·{' '}
            {byCat[c.key].filter((r) => !r.is_current).length} retired
          </p>
          {byCat[c.key].map((r) => (
            <CriterionRow key={r.id} row={r} />
          ))}
        </section>
      ))}

      {uncovered.length ? (
        <section style={{ margin: '34px 0 0' }}>
          <h2 style={{ marginBottom: 6 }}>Gauges with no published criteria</h2>
          <p className="small mute">
            {uncovered.map((c) => c.label).join(', ')}. These gauges have not sat at orange or red in
            the window the register covers and carried no movement criteria at the time. The gap is
            stated rather than filled. A criterion appears here the first run one is written.
          </p>
        </section>
      ) : null}

      {changelog.length ? (
        <section style={{ margin: '34px 0 0' }}>
          <h2 style={{ marginBottom: 6 }}>Methodology changelog</h2>
          <p className="small mute" style={{ margin: '0 0 12px' }}>
            Append-only. Material changes to gauge definitions, verdict rules, source rules or
            classification logic increment the version.
          </p>
          {changelog.map((p, i) => (
            <p key={i} className="small">
              {p}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
