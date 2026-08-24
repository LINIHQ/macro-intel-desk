import Link from 'next/link';
import { getLatestBrief, getStateHistory } from '@/lib/supabase';
import { fmtDate } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefItems from '@/components/BriefItems';
import Markdown from '@/components/Markdown';
import CrowdGauge from '@/components/CrowdGauge';
import ShareBlock from '@/components/ShareBlock';
import BriefAlertsToggle from '@/components/BriefAlertsToggle';

export const revalidate = 60;

export default async function LivePage() {
  const [brief, history] = await Promise.all([getLatestBrief(), getStateHistory()]);

  if (!brief) {
    return (
      <div>
        <h1>Macro dashboard</h1>
        <div className="empty">No published briefs yet. The first brief will appear here.</div>
      </div>
    );
  }

  const shareUrl = 'https://brief.genxkrypto.com';
  const shareText = brief.headline
    ? `XRP Macro Brief: ${brief.headline}`
    : 'XRP Macro Intelligence Desk';

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Macro dashboard</h1>
          <p className="page-meta">
            {fmtDate(brief.run_date)} · {brief.brief_mode} brief
          </p>
        </div>
        <CrowdGauge />
      </div>
      <div
        className="small mute"
        style={{
          margin: '10px 0 8px',
          padding: '6px 12px',
          borderLeft: '2px solid rgba(255,255,255,0.25)',
          letterSpacing: '0.02em',
        }}
      >
        <p style={{ margin: 0 }}>
          Morning brief drops Mon-Fri, 9-10am ET · Week-ending summary Saturday morning
        </p>
        <p style={{ margin: '7px 0 0' }}>
          Built and run independently by{' '}
          <a className="quiet-link" href="https://x.com/GenXKrypto" target="_blank" rel="noopener noreferrer">
            GenXKrypto
          </a>
          {' '}· Free · Independent · Not financial advice
        </p>
      </div>
      <BriefAlertsToggle />
      <p className="gauge-hint">
        <span className="hint-touch">Tap</span><span className="hint-pointer">Click</span> any gauge for analysis ↓
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

      <ShareBlock url={shareUrl} text={shareText} variant="inline" />

      <h2 id="full-brief">The brief</h2>
      <Markdown>{brief.full_brief_md}</Markdown>

      <ShareBlock url={shareUrl} text={shareText} />

      <p className="small mute" style={{ marginTop: 28 }}>
        Past briefs live in the <Link href="/archive">archive</Link>. Status shifts over time are on the{' '}
        <Link href="/history">history</Link> page.
      </p>
    </div>
  );
}
