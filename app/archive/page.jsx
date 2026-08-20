import Link from 'next/link';
import { getAllBriefs } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DotStrip from '@/components/DotStrip';

export const revalidate = 60;

export default async function ArchivePage() {
  const briefs = await getAllBriefs(false);

  return (
    <div>
      <h1>Brief archive</h1>
      <p className="page-sub">
        Every published run, complete and permanent. Click any run to open the full brief with its dashboard, ranked
        items, and sources.
      </p>
      {briefs.length ? (
        <div className="row-list">
          {briefs.map((b) => (
            <Link key={b.id} href={`/brief/${b.id}`} className="row-item" style={{ color: 'inherit' }}>
              <span>
                <span className="mono" style={{ fontWeight: 500 }}>
                  {fmtDate(b.run_date)} · {b.brief_mode} brief
                </span>
                <br />
                <span className="small dim">{b.headline || `${b.brief_mode} brief`}</span>
              </span>
              <DotStrip states={b.dashboard_states} labeled />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">No published briefs yet.</div>
      )}
    </div>
  );
}
