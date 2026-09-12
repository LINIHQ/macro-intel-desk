import { getClaims } from '@/lib/supabase';
import { VERIFICATION } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import SourcePills from '@/components/SourcePills';
import Markdown from '@/components/Markdown';
import LazyEvidence from '@/components/LazyEvidence';
import ClaimsScorecard from '@/components/ClaimsScorecard';
import ClaimsBrowser from '@/components/ClaimsBrowser';

// Widened from 60s (Sept 11, 2026): claims only change at publish time, once
// or twice a day, so a 60-second window bought no real freshness and cost real
// Active CPU on a route whose per-render cost only grows as the append-only
// tracker accumulates evidence text. 300s matches the window already proven
// safe on brief permalinks.
export const revalidate = 300;

const RANK = { unverified: 0, partially_verified: 1, contradicted: 2, opinion: 3, verified: 4 };

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
  const claims = await getClaims();

  const items = claims.map((cl) => ({
    id: cl.id,
    status: cl.current_status,
    rank: RANK[cl.current_status] ?? 99,
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
      <ClaimsScorecard claims={claims} />
      {claims.length ? (
        <ClaimsBrowser items={items} />
      ) : (
        <div className="empty">No tracked claims yet.</div>
      )}
    </div>
  );
}
