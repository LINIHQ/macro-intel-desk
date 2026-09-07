import BriefItems from './BriefItems';
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
export default function BriefBody({ brief, itemsHeading = 'Ranked items', itemsNote = null }) {
  const items = brief?.brief_items ?? [];
  const isSplit = Boolean(brief?.dashboard_md || brief?.top3_md || brief?.watch_next_md);

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
        <section id="dashboard-notes">
          <Markdown>{brief.dashboard_md}</Markdown>
        </section>
      ) : null}

      {brief.what_changed_md ? (
        <section id="what-changed">
          <h2>What changed</h2>
          <Markdown>{brief.what_changed_md}</Markdown>
        </section>
      ) : null}

      {brief.top3_md ? (
        <section id="top-3">
          <h2>Top 3 things that matter</h2>
          <Markdown>{brief.top3_md}</Markdown>
        </section>
      ) : null}

      <h2 id="ranked-items">{itemsHeading}</h2>
      {itemsNote}
      <BriefItems items={items} />

      {brief.watch_next_md ? (
        <section id="watch-next">
          <h2>Watch next</h2>
          <Markdown>{brief.watch_next_md}</Markdown>
        </section>
      ) : null}
    </>
  );
}
