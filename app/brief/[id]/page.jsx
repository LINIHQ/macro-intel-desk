import Link from 'next/link';
import { getBriefById } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefItems from '@/components/BriefItems';
import Markdown from '@/components/Markdown';

export const revalidate = 300;

export default async function BriefPage({ params }) {
  const brief = await getBriefById(params.id);

  if (!brief) {
    return (
      <div>
        <h1>Brief not found</h1>
        <p className="page-sub">
          This brief doesn't exist or isn't published. Back to the <Link href="/archive">archive</Link>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="card-head" style={{ marginBottom: 14 }}>
        <h1>
          {brief.run_label} · {fmtDate(brief.run_date)}
        </h1>
        <span className="mono small mute">{brief.brief_mode} brief</span>
      </div>
      <DashboardGrid states={brief.dashboard_states} />

      <h2>Top things that matter</h2>
      <BriefItems items={brief.brief_items} />

      <h2>Full brief</h2>
      <Markdown>{brief.full_brief_md}</Markdown>
    </div>
  );
}
