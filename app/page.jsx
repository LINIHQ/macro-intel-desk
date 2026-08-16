import Link from 'next/link';
import { getLatestBrief } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefItems from '@/components/BriefItems';
import Markdown from '@/components/Markdown';

export const revalidate = 60;

export default async function LivePage() {
  const brief = await getLatestBrief();

  if (!brief) {
    return (
      <div>
        <h1>Macro dashboard</h1>
        <div className="empty">No published briefs yet. The first run will appear here.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-head" style={{ marginBottom: 14 }}>
        <h1>Macro dashboard</h1>
        <span className="mono small mute">
          {brief.run_label} · {fmtDate(brief.run_date)} · {brief.brief_mode} brief
        </span>
      </div>
      <DashboardGrid states={brief.dashboard_states} />

      {brief.headline ? <p className="page-sub" style={{ marginTop: 18 }}>{brief.headline}</p> : null}

      <h2>Top things that matter</h2>
      <BriefItems items={brief.brief_items} />

      <h2>Full brief</h2>
      <Markdown>{brief.full_brief_md}</Markdown>

      <p className="small mute" style={{ marginTop: 28 }}>
        Prior runs live in the <Link href="/archive">archive</Link>. Status shifts over time are on the{' '}
        <Link href="/history">history</Link> page.
      </p>
    </div>
  );
}
