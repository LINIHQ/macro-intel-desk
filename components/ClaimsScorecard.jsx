import ReadoutStrip from '@/components/ReadoutStrip';
import { VERIFICATION } from '@/lib/format';

// Resolution record for the claim tracker, computed at render time from rows the
// page already fetched. Raw counts, not percentages: with a small sample,
// percentages read like false precision. Counts read like a ledger.
//
// Rendered as a readout strip (Sept 13, 2026): six stat tiles, one per verdict
// plus the total, each count in the verdict's own colour. A verdict with no
// claims shows its zero in the muted tier rather than lighting a colour for an
// empty bucket.
const ORDER = ['verified', 'partially_verified', 'unverified', 'contradicted', 'opinion'];

export default function ClaimsScorecard({ claims }) {
  if (!claims?.length) return null;

  const counts = {
    verified: 0,
    partially_verified: 0,
    unverified: 0,
    contradicted: 0,
    opinion: 0,
  };
  let verdictChanges = 0;

  for (const cl of claims) {
    if (counts[cl.current_status] !== undefined) counts[cl.current_status] += 1;
    const h = cl.claim_status_history || [];
    if (h.length > 1) verdictChanges += h.length - 1;
  }

  const tiles = [{ label: 'Claims tracked', value: String(claims.length) }].concat(
    ORDER.map((k) => ({
      label: VERIFICATION[k].label,
      value: String(counts[k]),
      color: counts[k] > 0 ? VERIFICATION[k].color : 'var(--mute)',
    }))
  );

  return (
    <div style={{ margin: '0 0 14px' }}>
      <ReadoutStrip items={tiles} cols={6} />
      <p className="small mute" style={{ margin: '10px 0 0' }}>
        Verdict changes logged: {verdictChanges}. History is append-only: verdicts move when evidence moves, nothing is deleted.
      </p>
    </div>
  );
}
