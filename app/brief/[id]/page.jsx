import Link from 'next/link';
import { getBriefById, getClassificationHistory, getCriteriaAsOf } from '@/lib/supabase';
import { fmtDate, fmtRunStamp } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefBody from '@/components/BriefBody';
import ShareBlock from '@/components/ShareBlock';

export const revalidate = 300;

// Same stamp treatment as the live page: a time landing on the same ET day as
// the brief drops its redundant date, because these stamps are uppercase and
// letter-spaced and wrap badly at 375px.
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

  // An archived brief is read as a record of what the desk published that day,
  // so its tiles answer with that day's evidence: the criteria in force on the
  // run date rather than today's, and a history window that ends at this brief
  // rather than running past it into classifications recorded later.
  const [history, criteria] = await Promise.all([
    getClassificationHistory(24, brief.run_date),
    getCriteriaAsOf(brief.run_date),
  ]);

  const permalink = `https://brief.genxkrypto.com/brief/${brief.id}`;
  const shareText = brief.headline
    ? `XRP Macro Brief: ${brief.headline}`
    : 'XRP Macro Intelligence Desk';
  const runStamp = fmtRunStamp(brief.created_at, brief.run_date);
  const verifiedText = stampText(brief.evidence_verified_through, brief.created_at);
  const updatedText =
    brief.last_updated_at && brief.last_updated_at !== brief.created_at
      ? stampText(brief.last_updated_at, brief.created_at)
      : null;

  return (
    <div>
      <div className="card-head" style={{ marginBottom: 14 }}>
        <h1>{fmtDate(brief.run_date)}</h1>
        <span className="mono small mute">
          {brief.brief_mode} brief{runStamp ? ` · published ${runStamp}` : ''}
        </span>
      </div>

      {verifiedText || updatedText ? (
        <p className="page-meta" style={{ marginTop: -6, marginBottom: 14 }}>
          {verifiedText ? `Evidence through ${verifiedText} ET` : null}
          {verifiedText && updatedText ? ' · ' : null}
          {updatedText ? `updated ${updatedText} ET` : null}
        </p>
      ) : null}

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

      <BriefBody brief={brief} />

      <ShareBlock url={permalink} text={shareText} />
    </div>
  );
}
