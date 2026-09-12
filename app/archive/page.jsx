import Link from 'next/link';
import { getAllBriefs } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DotStrip from '@/components/DotStrip';
import ArchiveBrowser from '@/components/ArchiveBrowser';

// Widened from 60s (Sept 11, 2026): the archive only gains a new row at
// publish time, once or twice a day, and the per-render cost grows with the
// row count as more briefs publish. 300s matches the window already proven
// safe on brief permalinks.
export const revalidate = 300;

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
