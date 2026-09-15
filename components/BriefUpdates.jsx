import Markdown from './Markdown';

// Post-publish updates to an already published brief.
//
// Added Sept 15, 2026, the day the Senate blocked the Clarity Act. The morning
// brief published at 9:55 and promised an update after the 2:15 cloture vote.
// That update first shipped as bold text prepended to dashboard_md, which was
// wrong twice over: it inherited the styling of the section it sat inside, so
// nothing marked it as new, and it crowded the XRP spot stamp directly beneath
// it. Prose does not stand out from prose.
//
// So updates get their own column and their own block. briefs.updates is a
// jsonb array of { time, label, body_md }, newest first, rendered above
// everything else on the page. An array rather than a single field because a
// second update on the same brief must stack under the first rather than
// overwrite it: the archival honesty rule says corrections and additions are
// additive, and a column that holds one update would quietly break that the
// first time a story moved twice in a day.
//
// Styling: this block deliberately reuses .sec / .sec-head / .sec-meta rather
// than defining its own classes in globals.css. Every other surface on a brief
// page is a .sec panel, and an update that invented its own box would drift
// from the rest the first time the panel treatment changes. Only the two
// things that make it distinct are set inline, and neither has a competing
// rule in the stylesheet, so this cannot repeat the Sept 8 bug where an
// inline width lost to a stylesheet max-width:
//
//   1. A 3px left rule in PFP blue, overriding only the left edge of .sec's
//      1px border.
//   2. A faint blue tint on the panel fill, so the whole block reads as a
//      different kind of thing at a glance rather than only at its edge.
//
// Blue for both, and not the status palette, for a specific reason: green,
// yellow, orange and red mean classification on this site and reach readers
// through the tiles and chips. An update block tinted with any of them would
// read as a ninth gauge. Blue and cyan are never semantic anywhere here, which
// makes PFP blue the one colour available to say "this is new" without saying
// anything about risk. Same reasoning as the ambient glow and the custom
// scrollbars.
//
// The stamp is the update's own time, not the brief's publication time and not
// last_updated_at. Those are three separate facts and the page header already
// keeps them separate; an update that borrowed one of the others would misdate
// itself the first time a typo fix touched last_updated_at.
//
// The id is stable at "update" so Discord and X copy can link straight to it
// (xrpmacro.com/#update). Multiple updates share the one anchor and it sits on
// the newest, which is the one being linked.

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

const PANEL = {
  borderLeft: '3px solid var(--pfp-blue)',
  background: 'color-mix(in srgb, var(--pfp-blue) 7%, var(--panel))',
};

export default function BriefUpdates({ updates }) {
  const rows = Array.isArray(updates) ? updates.filter((u) => u && u.body_md) : [];
  if (!rows.length) return null;

  return (
    <div id="update">
      {rows.map((u, i) => {
        const stamp = etStamp(u.time);
        return (
          <section
            className={i === 0 ? 'sec sec-first' : 'sec'}
            style={PANEL}
            key={`${u.time || 'u'}-${i}`}
          >
            <div className="sec-head">
              <h2>{u.label ? `Update: ${u.label}` : 'Update'}</h2>
              {stamp ? <span className="sec-meta">{stamp}</span> : null}
            </div>
            <Markdown>{u.body_md}</Markdown>
          </section>
        );
      })}
    </div>
  );
}
