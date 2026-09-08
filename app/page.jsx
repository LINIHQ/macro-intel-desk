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

// Date and time are split so a stamp landing on the same ET day as the brief can
// drop its date and show the time alone. The header stamps are uppercase and
// letter-spaced, which eats width fast: at 375px a full "Evidence verified
// through Sep 8, 12:00 PM ET" wrapped and orphaned the ET onto its own line.
function etParts(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }),
  };
}

function stampText(iso, sameDayAsIso) {
  const p = etParts(iso);
  if (!p) return null;
  const ref = etParts(sameDayAsIso);
  return ref && ref.date === p.date ? p.time : `${p.date}, ${p.time}`;
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

  // Publication time, evidence cutoff and last edit are three different facts and
  // stay three different facts. They used to stack as three separate lines under
  // the date, which on a phone was four lines of metadata before any content.
  // Publication and evidence now share a line, since a reader reads them together
  // (published then, verified through then), and the edit stamp keeps its own line
  // because it is the one that only sometimes exists.
  const verifiedText = stampText(brief.evidence_verified_through, brief.created_at);
  const updatedText =
    brief.last_updated_at && brief.last_updated_at !== brief.created_at
      ? stampText(brief.last_updated_at, brief.created_at)
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
          {runStamp || verifiedText ? (
            <p className="page-meta" style={{ marginTop: 4 }}>
              {runStamp ? `Published ${runStamp}` : null}
              {runStamp && verifiedText ? ' · ' : null}
              {verifiedText ? `evidence through ${verifiedText} ET` : null}
            </p>
          ) : null}
          {updatedText ? (
            <p className="page-meta" style={{ marginTop: 4 }}>
              Updated {updatedText} ET
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
