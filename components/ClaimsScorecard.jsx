import { VERIFICATION } from '@/lib/format';

// Resolution record for the claim tracker, computed at render time from rows the
// page already fetched. Raw counts, not percentages: with a small sample,
// percentages read like false precision. Counts read like a ledger.
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

  const order = ['verified', 'partially_verified', 'unverified', 'contradicted', 'opinion'];

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div className="mono small" style={{ display: 'flex', flexWrap: 'wrap', columnGap: '18px', rowGap: '6px' }}>
        <span>
          <span className="mute">CLAIMS TRACKED</span> <strong>{claims.length}</strong>
        </span>
        {order.map((k) => (
          <span key={k}>
            <span className="mute">{VERIFICATION[k].label.toUpperCase()}</span>{' '}
            <strong style={{ color: VERIFICATION[k].color }}>{counts[k]}</strong>
          </span>
        ))}
      </div>
      <p className="small mute" style={{ margin: '8px 0 0' }}>
        Verdict changes logged: {verdictChanges}. History is append-only: verdicts move when evidence moves, nothing is deleted.
      </p>
    </div>
  );
}
