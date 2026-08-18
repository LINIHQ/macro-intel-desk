import Markdown from '@/components/Markdown';
import StatusChip from '@/components/StatusChip';
import SourcePills from '@/components/SourcePills';
import { IMPORTANCE, VERIFICATION } from '@/lib/format';

export default function BriefItems({ items }) {
  const sorted = [...(items || [])].sort((a, b) => a.rank - b.rank);
  if (!sorted.length) return null;
  return (
    <div>
      {sorted.map((it) => {
        const imp = IMPORTANCE[it.importance] || IMPORTANCE.low;
        const ver = VERIFICATION[it.verification] || VERIFICATION.opinion;
        return (
          <div key={it.id} className="card">
            <div className="card-head">
              <p className="card-title">
                <span className="card-rank">{it.rank}.</span> {it.title}
              </p>
              <span className="card-chips">
                <StatusChip color={imp.color}>{imp.label}</StatusChip>
                <StatusChip color={ver.color}>
                  {it.verification === 'verified' ? '\u2713 ' : ''}
                  {ver.label}
                </StatusChip>
              </span>
            </div>
            <Markdown>{it.body_md}</Markdown>
            <SourcePills sources={it.sources} />
          </div>
        );
      })}
    </div>
  );
}
