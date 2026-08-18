import { getClaims } from '@/lib/supabase';
import { VERIFICATION } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import SourcePills from '@/components/SourcePills';
import Markdown from '@/components/Markdown';
import ClaimsScorecard from '@/components/ClaimsScorecard';

export const revalidate = 60;

export default async function ClaimsPage() {
  const claims = await getClaims();

  return (
    <div>
      <h1>Claim tracker</h1>
      <p className="page-sub">
        Every consequential claim the desk has checked, with its current verdict. Verdicts change when evidence
        changes, and the history stays public.
      </p>
      <ClaimsScorecard claims={claims} />
      {claims.length ? (
        claims.map((cl) => {
          const ver = VERIFICATION[cl.current_status] || VERIFICATION.opinion;
          const history = [...(cl.claim_status_history || [])].sort(
            (a, b) => new Date(b.changed_at) - new Date(a.changed_at)
          );
          return (
            <div key={cl.id} className="card">
              <div className="card-head">
                <p className="card-title">{cl.claim_text}</p>
                <StatusChip color={ver.color}>{ver.label}</StatusChip>
              </div>
              <p className="small mute mono" style={{ margin: '4px 0 10px' }}>
                First seen {cl.first_seen_date}
                {cl.source_origin ? ` · origin: ${cl.source_origin}` : ''}
                {!cl.is_active ? ' · archived' : ''}
              </p>
              {cl.why_it_matters ? <p className="small dim" style={{ margin: '0 0 10px' }}>{cl.why_it_matters}</p> : null}
              <Markdown>{cl.evidence_md}</Markdown>
              <SourcePills sources={cl.sources} />
              {history.length > 1 ? (
                <p className="small mute" style={{ margin: '8px 0 0' }}>
                  Verdict history:{' '}
                  {history
                    .map((h) => `${(VERIFICATION[h.status] || {}).label || h.status} (${new Date(h.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`)
                    .join(' ← ')}
                </p>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="empty">No tracked claims yet.</div>
      )}
    </div>
  );
}
