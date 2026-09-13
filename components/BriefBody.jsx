import BriefItems from './BriefItems';
import TopThree from './TopThree';
import Markdown from './Markdown';

// Reading order for a brief page.
//
// Briefs from Sept 7, 2026 onward store their sections in separate columns so
// the page can place them around the ranked items. Order is: where things stand,
// Top 3, what changed, the items, Watch Next. Roughly 80% of readers are on
// mobile, and leading with nine item cards made them build their own sense of
// priority before the page gave them one.
//
// Top 3 sits above What changed as of Sept 8, 2026. Both the Discord teaser and
// the X parent are built to name the Top 3 and withhold it, so the first thing a
// click-through should hit is the thing it was sold. What changed is a diff, most
// valuable to a reader already following daily, and it reads as the wider sweep
// after the headline rather than as the way in. The cost of the swap is that the
// pointers no longer sit directly above the cards they index, which would matter
// on a phone if the pointers were only labels; each Top 3 title is an anchor to
// its own item card, so a tap still lands on the item itself.
//
// Briefs published before Sept 7 have those columns null. They render the old
// way, from full_brief_md, below the items. Never render both: full_brief_md
// remains the canonical whole document in the database, but for split briefs the
// sections above ARE that document, and rendering it again would duplicate
// every section on the page.
//
// Top 3: briefs.top3 (structured) renders chip rows via TopThree, which reads
// title and both chips off brief_items so the pointer can never disagree with
// the card. briefs.top3_md is the plain-text archive copy and the fallback for
// any brief written before the structured column existed.
//
// Section panels (Sept 13, 2026): each surface sits in its own rounded panel
// with a header row, title left and a short meta stamp right, the same grammar
// LINI Ledger uses for its cards. Spacing between panels lives in globals.css
// (.sec, .sec-first, .sec-plain), not inline. Ranked items are the exception:
// they are the product, and boxing seven long cards inside one more box would
// cost roughly 30px of width per side on a 375px phone, so that section keeps
// the item cards unboxed, standing on their own.
//
// Ranked items header (refined Sept 13, 2026): the section still uses
// .sec-plain for its outer spacing so the item cards below stay unboxed, but
// the header row itself (title, item count, the "ranked by weight" note) now
// sits in its own small .sec panel. Every other section's header lives inside
// the same bubble as its content; leaving this one floating on the bare page
// background read as unfinished next to the rest, even though the cards below
// it were always individually boxed. This gives the header the same visual
// weight without nesting the item cards inside a second box.
//
// The meta stamps state facts the page already has: the evidence cutoff on the
// dashboard notes, the item count on the ranked list. The other three are fixed
// labels describing what the surface is for; they never carry data.

function etStamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
  return `${date}, ${time} ET`;
}

function SectionHead({ title, meta }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {meta ? <span className="sec-meta">{meta}</span> : null}
    </div>
  );
}

export default function BriefBody({ brief, itemsHeading = 'Ranked items', itemsNote = null }) {
  const items = brief?.brief_items ?? [];
  const isSplit = Boolean(brief?.dashboard_md || brief?.top3_md || brief?.watch_next_md);
  const hasStructuredTop3 = Array.isArray(brief?.top3) && brief.top3.length > 0;

  if (!isSplit) {
    return (
      <>
        <h2>Top things that matter</h2>
        {itemsNote}
        <BriefItems items={items} />

        <h2 id="full-brief">The brief</h2>
        <Markdown>{brief?.full_brief_md}</Markdown>
      </>
    );
  }

  const verified = etStamp(brief.evidence_verified_through);
  const itemCount = items.length;

  return (
    <>
      {brief.dashboard_md ? (
        <section id="dashboard-notes" className="sec sec-first">
          <SectionHead
            title="Where things stand"
            meta={verified ? `Evidence through ${verified}` : null}
          />
          <Markdown>{brief.dashboard_md}</Markdown>
        </section>
      ) : null}

      {hasStructuredTop3 || brief.top3_md ? (
        <section id="top-3" className="sec">
          <SectionHead title="Top 3 things that matter" meta="Index to the ranked items" />
          {hasStructuredTop3 ? (
            <TopThree pointers={brief.top3} items={items} />
          ) : (
            <Markdown>{brief.top3_md}</Markdown>
          )}
        </section>
      ) : null}

      {brief.what_changed_md ? (
        <section id="what-changed" className="sec">
          <SectionHead title="What changed" meta="Since the prior brief" />
          <Markdown>{brief.what_changed_md}</Markdown>
        </section>
      ) : null}

      <section id="ranked-items" className="sec-plain">
        <div className="sec" style={{ marginBottom: 14 }}>
          <SectionHead
            title={itemsHeading}
            meta={itemCount ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : null}
          />
          {itemsNote}
        </div>
        <BriefItems items={items} />
      </section>

      {brief.watch_next_md ? (
        <section id="watch-next" className="sec">
          <SectionHead title="Watch next" meta="Thresholds and dates" />
          <Markdown>{brief.watch_next_md}</Markdown>
        </section>
      ) : null}
    </>
  );
}
