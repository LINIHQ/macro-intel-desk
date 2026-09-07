import BriefItems from './BriefItems';
import TopThree from './TopThree';
import Markdown from './Markdown';

// Reading order for a brief page.
//
// Briefs from Sept 7, 2026 onward store their sections in separate columns so
// the page can place them around the ranked items: dashboard context and what
// changed come first, the Top 3 points down into the items, the items carry the
// analysis, and Watch Next closes. Roughly 80% of readers are on mobile, and
// leading with nine item cards made them build their own sense of priority
// before the page gave them one.
//
// Briefs published before that date have those columns null. They render the
// old way, from full_brief_md, below the items. Never render both: full_brief_md
// remains the canonical whole document in the database, but for split briefs the
// sections above ARE that document, and rendering it again would duplicate
// every section on the page.
//
// Top 3: briefs.top3 (structured) renders chip rows via TopThree, which reads
// title and both chips off brief_items so the pointer can never disagree with
// the card. briefs.top3_md is the plain-text archive copy and the fallback for
// any brief written before the structured column existed.
//
// Spacing: sections are separate markdown blocks now, not one continuous
// document, so the rhythm the old single block got for free has to be set here.
// The first section needs the largest gap because it follows the amendments
// strip, which is a dense one-line element.
const SECTION = { marginTop: 30 };
const FIRST_SECTION = { marginTop: 38 };

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

  return (
    <>
      {brief.dashboard_md ? (
        <section id="dashboard-notes" style={FIRST_SECTION}>
          <h2>Where things stand</h2>
          <Markdown>{brief.dashboard_md}</Markdown>
        </section>
      ) : null}

      {brief.what_changed_md ? (
        <section id="what-changed" style={SECTION}>
          <h2>What changed</h2>
          <Markdown>{brief.what_changed_md}</Markdown>
        </section>
      ) : null}

      {hasStructuredTop3 || brief.top3_md ? (
        <section id="top-3" style={SECTION}>
          <h2>Top 3 things that matter</h2>
          <p className="small mute" style={{ margin: '2px 0 16px' }}>
            Where to spend attention in the ranked items below.
          </p>
          {hasStructuredTop3 ? (
            <TopThree pointers={brief.top3} items={items} />
          ) : (
            <Markdown>{brief.top3_md}</Markdown>
          )}
        </section>
      ) : null}

      <section id="ranked-items" style={SECTION}>
        <h2>{itemsHeading}</h2>
        {itemsNote}
        <BriefItems items={items} />
      </section>

      {brief.watch_next_md ? (
        <section id="watch-next" style={SECTION}>
          <h2>Watch next</h2>
          <Markdown>{brief.watch_next_md}</Markdown>
        </section>
      ) : null}
    </>
  );
}
