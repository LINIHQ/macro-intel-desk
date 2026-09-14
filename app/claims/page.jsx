import { getClaims } from '@/lib/supabase';
import { VERIFICATION, fmtStampET } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import SourcePills from '@/components/SourcePills';
import Markdown from '@/components/Markdown';
import LazyEvidence from '@/components/LazyEvidence';
import ClaimsScorecard from '@/components/ClaimsScorecard';
import ClaimsBrowser from '@/components/ClaimsBrowser';

// Purged on demand at publish by /api/revalidate; the number below is only a
// backstop for the case where that call never lands.
//
// History: 60s until Sept 11, 2026, then 300s. Both were timers, and a timer
// is the wrong shape for this route entirely. Supabase request logs for a
// single 24-hour window showed 199 regenerations here against content that
// changed exactly once, when a brief published. This is also the most
// expensive route on the site, 135 claims and a 219 kB payload with markdown
// parsed per card, and it gets more expensive every day because the tracker is
// append-only by design.
//
// 3600 is deliberately not `false`. Fully static would be cheaper still, but
// it would mean a missed webhook leaves stale verdicts up indefinitely, and on
// Sept 14, 2026 the publish-time webhook to the push function did exactly that
// kind of failing. An hour of staleness is a bad day; permanent staleness on a
// public receipts trail is a broken promise.
export const revalidate = 3600;

// Sort order for the default "open questions first" view, and the group each
// verdict belongs to. Within a group the sequence is the taxonomy subsequence
// (verified, partially verified, unverified, contradicted, opinion), so the
// card stack and the filter chips above it differ on nothing except which
// block leads.
//
// Contradicted moved from rank 2 into the settled block on Sept 14, 2026. A
// contradicted claim is closed: the desk checked it and reliable evidence went
// against it. Ranking it as an open question put 15 settled cards inside a
// leading block of 47 that claimed to be unresolved, and pushed the first
// verified verdict roughly three phone screens further down.
//
// The block that leads is still the unresolved one, deliberately. Leading with
// verified would put 86 mostly settled, mostly favourable verdicts at the top
// of the page whose whole purpose is showing the desk does not bury what it
// has not landed.
const RANK = { partially_verified: 0, unverified: 1, verified: 2, contradicted: 3, opinion: 4 };
const GROUP = {
  partially_verified: 'open',
  unverified: 'open',
  verified: 'settled',
  contradicted: 'settled',
  opinion: 'settled',
};

// Evidence accretes downward: the original assessment is written first and every
// later correction, upgrade or scope note is appended beneath it with its date.
// That is the right way to keep a record and the wrong way to read one, because
// the current conclusion ends up furthest from the top of the card.
//
// This lifts the most recent dated entry to the front as the current assessment.
// It does not reorder, rewrite or hide anything: the complete evidence field is
// rendered underneath exactly as published, so the chronology stays intact and
// the lifted paragraph appears in both places rather than being moved out of the
// record.
const UPDATE_RE =
  /^\*\*\s*(CORRECTION|UPDATE|UPGRADE|SCOPE|CLARIFICATION|NOTE|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)/i;

function splitAssessment(md) {
  if (!md) return { lead: '', hasRecord: false, entries: 0 };
  const blocks = md
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (blocks.length <= 1) return { lead: blocks[0] || '', hasRecord: false, entries: blocks.length };
  for (let i = blocks.length - 1; i >= 1; i--) {
    if (UPDATE_RE.test(blocks[i])) return { lead: blocks[i], hasRecord: true, entries: blocks.length };
  }
  return { lead: blocks[0], hasRecord: true, entries: blocks.length };
}

function fmtDay(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ClaimCard({ cl }) {
  const ver = VERIFICATION[cl.current_status] || VERIFICATION.opinion;
  const history = [...(cl.claim_status_history || [])].sort(
    (a, b) => new Date(b.changed_at) - new Date(a.changed_at)
  );
  const { lead, hasRecord, entries } = splitAssessment(cl.evidence_md);
  const updated = fmtDay(cl.updated_at);

  return (
    <div className="card">
      <div className="card-head">
        <p className="card-title">{cl.claim_text}</p>
        <span className="card-chips">
          <StatusChip color={ver.color}>{ver.label}</StatusChip>
        </span>
      </div>
      <p className="small mute mono" style={{ margin: '4px 0 10px' }}>
        First seen {cl.first_seen_date}
        {cl.source_origin ? ` · origin: ${cl.source_origin}` : ''}
        {!cl.is_active ? ' · archived' : ''}
      </p>
      {cl.why_it_matters ? (
        <p className="small dim" style={{ margin: '0 0 10px' }}>
          {cl.why_it_matters}
        </p>
      ) : null}

      <p className="small mute" style={{ margin: '0 0 4px', letterSpacing: '0.04em' }}>
        CURRENT ASSESSMENT{updated ? `, UPDATED ${updated.toUpperCase()}` : ''}
      </p>
      <Markdown>{lead}</Markdown>

      {/* Added Sept 11, 2026: the full record used to render inline here via
          <Markdown>, server-side, on every claim, every regeneration, whether
          or not the <details> was ever opened. LazyEvidence defers that parse
          to the browser and only when a reader actually expands it. */}
      {hasRecord ? <LazyEvidence evidenceMd={cl.evidence_md} entries={entries} /> : null}

      <SourcePills sources={cl.sources} />
      {history.length > 1 ? (
        <p className="small mute" style={{ margin: '8px 0 0' }}>
          Verdict history:{' '}
          {history
            .map(
              (h) =>
                `${(VERIFICATION[h.status] || {}).label || h.status} (${new Date(h.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
            )
            .join(' ← ')}
        </p>
      ) : null}
    </div>
  );
}

export default async function ClaimsPage() {
  // Captured before the read, so the stamp can never claim to be newer than
  // the data it describes.
  const readAt = new Date().toISOString();
  const claims = await getClaims();

  // The newest verdict movement in the record itself, which is a different
  // fact from when the page was built and answers a different question.
  // "Read at" tells you how fresh this copy of the page is. "Newest change"
  // tells you when the desk last moved a verdict, so a page that is genuinely
  // current does not look suspicious just because nothing changed today.
  const newestChange = claims.reduce((max, cl) => {
    const t = cl.updated_at || '';
    return t > max ? t : max;
  }, '');

  const items = claims.map((cl) => ({
    id: cl.id,
    status: cl.current_status,
    rank: RANK[cl.current_status] ?? 99,
    group: GROUP[cl.current_status] || 'settled',
    updatedAt: cl.updated_at || cl.first_seen_date || '',
    haystack: `${cl.claim_text || ''} ${cl.why_it_matters || ''} ${(cl.evidence_md || '').slice(0, 1500)} ${(cl.sources || [])
      .map((s) => s?.label || '')
      .join(' ')}`.toLowerCase(),
    node: <ClaimCard cl={cl} />,
  }));

  return (
    <div>
      <h1>Claim tracker</h1>
      <p className="page-sub">
        Every consequential claim the desk has checked, with its current verdict. Verdicts change when evidence
        changes, and the history stays public.
      </p>

      {/* Freshness stamp, added Sept 14, 2026.
          This page is statically regenerated, so what a reader sees is a copy
          taken at a point in time rather than a live query. On Sept 14 a failed
          read cached an empty page and nothing on screen said how old it was.
          Reads now retry and then throw rather than render empty, so the stale
          copy that survives is at least correct, but correct-and-old still needs
          to announce itself: on a public receipts trail, a verdict shown without
          a timestamp implicitly claims to be current.
          Each stamp wraps whole so a narrow screen breaks at the separator. */}
      {claims.length ? (
        <p className="small mute mono" style={{ margin: '-2px 0 14px' }}>
          <span style={{ whiteSpace: 'nowrap' }}>Record read {fmtStampET(readAt)}</span>
          {newestChange ? (
            <>
              {' · '}
              <span style={{ whiteSpace: 'nowrap' }}>
                newest verdict change {fmtStampET(newestChange)}
              </span>
            </>
          ) : null}
        </p>
      ) : null}

      <ClaimsScorecard claims={claims} />
      {claims.length ? (
        <ClaimsBrowser items={items} />
      ) : (
        <div className="empty">No tracked claims yet.</div>
      )}
    </div>
  );
}
