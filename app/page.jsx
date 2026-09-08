import Link from 'next/link';
import { getLatestBrief, getClassificationHistory, getCurrentCriteria } from '@/lib/supabase';
import { fmtDate, fmtRunStamp } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefBody from '@/components/BriefBody';
import CrowdGauge from '@/components/CrowdGauge';
import ShareBlock from '@/components/ShareBlock';
import BriefAlertsToggle from '@/components/BriefAlertsToggle';
import { AmendmentsStrip } from '@/components/AmendmentsPanel';

export const revalidate = 60;

function fmtStamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

export default async function LivePage() {
  const [brief, history, criteria] = await Promise.all([
    getLatestBrief(),
    getClassificationHistory(),
    getCurrentCriteria(),
  ]);

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
  const runStamp = fmtRunStamp(brief.created_at, brief.run_date);

  // Publication time and evidence cutoff are different facts and are shown as
  // different facts. A brief published in the morning can carry evidence verified
  // later the same day, and an edit after publication moves neither of the first two.
  const verifiedStamp = fmtStamp(brief.evidence_verified_through);
  const updatedStamp =
    brief.last_updated_at && brief.last_updated_at !== brief.created_at
      ? fmtStamp(brief.last_updated_at)
      : null;

  const itemsNote = (
    <p className="small mute" style={{ margin: '2px 0 14px' }}>
      Ranked by weight, tagged by verdict. Every item carries its own sources.
    </p>
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Macro dashboard</h1>
          <p className="page-meta">
            {fmtDate(brief.run_date)} · {brief.brief_mode} brief
          </p>
          {runStamp ? (
            <p className="page-meta" style={{ marginTop: 4 }}>
              Published {runStamp}
            </p>
          ) : null}
          {verifiedStamp ? (
            <p className="page-meta" style={{ marginTop: 4 }}>
              Evidence verified through {verifiedStamp} ET
            </p>
          ) : null}
          {updatedStamp ? (
            <p className="page-meta" style={{ marginTop: 4 }}>
              Last updated {updatedStamp} ET
            </p>
          ) : null}
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
      <DashboardGrid
        states={brief.dashboard_states}
        history={history}
        criteria={criteria}
        verifiedThrough={brief.evidence_verified_through}
      />

      {brief.headline ? (
        <div className="term-box">
          <span className="term-prompt">&gt;_</span>
          <p>{brief.headline}</p>
        </div>
      ) : null}

      <AmendmentsStrip />

      <BriefBody brief={brief} itemsNote={itemsNote} />

      <ShareBlock url={shareUrl} text={shareText} />

      <p className="small mute" style={{ marginTop: 28 }}>
        Past briefs live in the <Link href="/archive">archive</Link>. Status shifts over time are on the{' '}
        <Link href="/history">history</Link> page. Every gauge test and every revision to one is on the{' '}
        <Link href="/methodology">criterion register</Link>.
      </p>
    </div>
  );
}
