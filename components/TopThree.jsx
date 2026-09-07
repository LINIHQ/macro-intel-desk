import StatusChip from '@/components/StatusChip';
import { IMPORTANCE, VERIFICATION } from '@/lib/format';

// Top 3 pointers.
//
// The pointer rows carry the same importance and verification chips the item
// cards below use, drawn from the same StatusChip and the same lib/format
// tables. Title and both chips are looked up from brief_items by rank, so the
// Top 3 can never disagree with the card it points at: change a verdict on the
// item and this updates with it. briefs.top3 stores only the rank and the one
// line saying why it ranks there.
//
// Each title links to #item-{rank}, the anchor BriefItems puts on that card, so
// a tap lands on the item itself rather than the top of the section. The whole
// point of the pointer is saving a mobile reader the scroll; landing them at
// the section head would not do that.
//
// Rows are deliberately lighter than a card: no border box, no body, no
// sources. This is a table of contents, not a second telling.
export default function TopThree({ pointers, items }) {
  const list = Array.isArray(pointers) ? pointers : [];
  const byRank = new Map((items || []).map((it) => [it.rank, it]));

  const rows = list
    .map((p, i) => ({ ...p, item: byRank.get(p.rank), position: i + 1 }))
    .filter((r) => r.item);

  if (!rows.length) return null;

  return (
    <div>
      {rows.map(({ item, note, position }) => {
        const imp = IMPORTANCE[item.importance] || IMPORTANCE.low;
        const ver = VERIFICATION[item.verification] || VERIFICATION.opinion;
        return (
          <div key={item.id} style={{ margin: '0 0 18px' }}>
            <div className="card-head">
              <p className="card-title">
                <span className="card-rank">{position}.</span>{' '}
                <a className="quiet-link" href={`#item-${item.rank}`}>
                  {item.title}
                </a>
              </p>
              <span className="card-chips">
                <StatusChip color={imp.color}>{imp.label}</StatusChip>
                <StatusChip color={ver.color}>
                  {item.verification === 'verified' ? '\u2713 ' : ''}
                  {ver.label}
                </StatusChip>
              </span>
            </div>
            {note ? (
              <p className="small mute" style={{ margin: '6px 0 0' }}>
                {note}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
