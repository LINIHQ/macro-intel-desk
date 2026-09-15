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
// Colour: a left accent rule in PFP blue. The status scale (green, yellow,
// orange, red) is reserved for classification and reaches readers through the
// tiles and chips only, so an update block tinted with any of those would read
// as a ninth gauge. Blue and cyan are never semantic on this site, which makes
// PFP blue the one colour available to say "this is new" without saying
// anything about risk. The block is otherwise the same panel grammar as every
// other section.
//
// The stamp is the update's own time, not the brief's publication time and not
// last_updated_at. Those are three separate facts and the page already keeps
// them separate in the header; an update that borrowed one of the others would
// misdate itself the first time a typo fix touched last_updated_at.
//
// The id is stable at "update" so Discord and X copy can link straight to it
// (xrpmacro.com/#update). Multiple updates share the one anchor, landing the
// reader on the newest, which is the one being linked.

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

export default function BriefUpdates({ updates }) {
  const rows = Array.isArray(updates) ? updates.filter((u) => u && u.body_md) : [];
  if (!rows.length) return null;

  return (
    <div id="update" className="upd-wrap">
      {rows.map((u, i) => {
        const stamp = etStamp(u.time);
        return (
          <section className="upd" key={`${u.time || 'u'}-${i}`}>
            <div className="upd-head">
              <span className="upd-tag">Update</span>
              {stamp ? <span className="upd-time">{stamp}</span> : null}
            </div>
            {u.label ? <div className="upd-label">{u.label}</div> : null}
            <Markdown>{u.body_md}</Markdown>
          </section>
        );
      })}
    </div>
  );
}
