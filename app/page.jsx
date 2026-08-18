import Link from 'next/link';
import { getLatestBrief, getStateHistory } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefItems from '@/components/BriefItems';
import Markdown from '@/components/Markdown';
import CrowdGauge from '@/components/CrowdGauge';
import ShareBlock from '@/components/ShareBlock';

export const revalidate = 60;

export default async function LivePage() {
  const [brief, history] = await Promise.all([getLatestBrief(), getStateHistory()]);

  if (!brief) {
    return (
      <div>
        <h1>Macro dashboard</h1>
        <div className="empty">No published briefs yet. The first run will appear here.</div>
      </div>
    );
  }

  const shareUrl = 'https://brief.genxkrypto.com';
  const shareText = brief.headline
    ? `${brief.run_label}: ${brief.headline}`
    : `${brief.run_label}, XRP Macro Intelligence Desk`;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Macro dashboard</h1>
          <p className="page-meta">
            {brief.run_label} · {fmtDate(brief.run_date)} · {brief.brief_mode} brief
          </p>
        </div>
        <CrowdGauge />
      </div>
      <p
        className="small mute"
        style={{
          margin: '10px 0 22px',
          padding: '6px 12px',
          borderLeft: '2px solid rgba(255,255,255,0.25)',
          letterSpacing: '0.02em',
        }}
      >
        Quick brief drops each morning Mon-Thu, 9-10am ET · Week-ending brief Friday after US market close
      </p>
      <DashboardGrid states={brief.dashboard_states} history={history} />

      {brief.headline ? (
        <div className="term-box">
          <span className="term-prompt">&gt;_</span>
          <p>{brief.headline}</p>
        </div>
      ) : null}

      <h2>Top things that matter</h2>
      <p className="small mute" style={{ margin: '2px 0 14px' }}>
        Ranked by weight, tagged by verdict. <a className="quiet-link" href="#full-brief">Full detail in the brief below.</a>
      </p>
      <BriefItems items={brief.brief_items} />

      <h2 id="full-brief">Full brief</h2>
      <Markdown>{brief.full_brief_md}</Markdown>

      <ShareBlock url={shareUrl} text={shareText} />

      <p className="small mute" style={{ marginTop: 28 }}>
        Prior runs live in the <Link href="/archive">archive</Link>. Status shifts over time are on the{' '}
        <Link href="/history">history</Link> page.
      </p>
    </div>
  );
}
