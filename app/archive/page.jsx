import Link from 'next/link';
import { getAllBriefs } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DotStrip from '@/components/DotStrip';
import ArchiveBrowser from '@/components/ArchiveBrowser';

// Purged on demand at publish by /api/revalidate; the number below is only a
// backstop for the case where that call never lands.
//
// History: 60s until Sept 11, 2026, then 300s. The archive gains a row only
// at publish, and its per-render cost grows with every brief that has ever
// published, so a timer here gets steadily more expensive while buying
// steadily less.
export const revalidate = 3600;

export default async function ArchivePage() {
  const briefs = await getAllBriefs(false);

  const items = briefs.map((b) => ({
    id: b.id,
    mode: b.brief_mode,
    haystack: `${fmtDate(b.run_date)} ${b.run_date} ${b.brief_mode} ${b.headline || ''}`.toLowerCase(),
    node: (
      <Link href={`/brief/${b.id}`} className="row-item" style={{ color: 'inherit' }}>
        <span style={{ minWidth: 0 }}>
          <span className="mono" style={{ fontWeight: 500 }}>
            {fmtDate(b.run_date)} · {b.brief_mode} brief
          </span>
          <br />
          {/* Headlines run long enough that a list of them stops being scannable.
              Clamped to two lines here; the full headline is on the brief itself. */}
          <span
            className="small dim"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {b.headline || `${b.brief_mode} brief`}
          </span>
        </span>
        <DotStrip states={b.dashboard_states} labeled />
      </Link>
    ),
  }));

  return (
    <div>
      <h1>Brief archive</h1>
      <p className="page-sub">
        Every published brief, complete and permanent. Click any date to open the full brief with its dashboard,
        ranked items, and sources.
      </p>
      {briefs.length ? (
        <ArchiveBrowser items={items} />
      ) : (
        <div className="empty">No published briefs yet.</div>
      )}
    </div>
  );
}
