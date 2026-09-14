import Link from 'next/link';
import { getCriteriaRegister, getDeskConfig } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/format';

// Purged on demand at publish by /api/revalidate; the number below is only a
// backstop for the case where that call never lands.
//
// Was 60s. The register is append-only and changes only when a run writes a
// criterion revision, which is rarer than a publish, so a one-minute timer was
// rebuilding a static page roughly 1,440 times a day at its limit.
export const revalidate = 3600;

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

// Card panel per criterion (Sept 13, 2026 polish pass), matching the Claims and
// Ranked Items pattern: .card for the box, .chip pills instead of a coloured
// left border for status. Direction uses the same --r/--g semantic pair as the
// tile trend arrows (worsen reads adverse, improve reads favourable); in-force
// vs retired uses --g vs --mute, the same pairing StatusChip uses for an active
// vs archived state elsewhere on the site.
function CriterionRow({ row }) {
  const dirColor = row.direction === 'worsen' ? 'var(--r)' : 'var(--g)';
  const statusColor = row.is_current ? 'var(--g)' : 'var(--mute)';
  return (
    <div className="card" style={row.is_current ? undefined : { opacity: 0.82 }}>
      <div className="card-chips" style={{ marginBottom: 8 }}>
        <span className="chip" style={{ '--chip-c': dirColor }}>
          {row.direction === 'worsen' ? 'WORSENS' : 'IMPROVES'}
        </span>
        <span className="chip" style={{ '--chip-c': statusColor }}>
          {row.is_current ? 'IN FORCE' : 'RETIRED'}
        </span>
      </div>
      <p className="small mute" style={{ margin: '0 0 8px' }}>
        {row.is_current ? (
          <>In force since {fmtDay(row.effective_date)}</>
        ) : (
          <>
            In force {fmtDay(row.effective_date)} to {fmtDay(row.superseded_date)}
          </>
        )}
      </p>
      <p style={{ margin: '0 0 8px' }}>{row.criterion_md}</p>
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
        <section key={c.key} className="sec-plain">
          <div className="sec-head">
            <h2>{c.label}</h2>
            <span className="sec-meta">
              {byCat[c.key].filter((r) => r.is_current).length} in force ·{' '}
              {byCat[c.key].filter((r) => !r.is_current).length} retired
            </span>
          </div>
          {byCat[c.key].map((r) => (
            <CriterionRow key={r.id} row={r} />
          ))}
        </section>
      ))}

      {uncovered.length ? (
        <section className="sec-plain">
          <div className="sec-head">
            <h2>Gauges with no published criteria</h2>
          </div>
          <p className="small mute">
            {uncovered.map((c) => c.label).join(', ')}. These gauges have not sat at orange or red in
            the window the register covers and carried no movement criteria at the time. The gap is
            stated rather than filled. A criterion appears here the first run one is written.
          </p>
        </section>
      ) : null}

      {changelog.length ? (
        <section className="sec-plain">
          <div className="sec-head">
            <h2>Methodology changelog</h2>
          </div>
          <p className="small mute" style={{ margin: '0 0 12px' }}>
            Append-only. Material changes to gauge definitions, verdict rules, source rules or
            classification logic increment the version.
          </p>
          {changelog.map((p, i) => (
            <div key={i} className="card">
              <p className="small" style={{ margin: 0 }}>
                {p}
              </p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
