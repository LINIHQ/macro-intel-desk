// Link-preview description for the live page.
//
// Sept 17, 2026. Discord builds its embed card from og:title, og:description
// and og:image, and nothing else. A pasted link cannot carry fields, an author
// avatar or a timestamp, whatever an unfurled X post appears to show: Discord
// special-cases X for the avatar and the footer line, and that path is not
// available to anyone else. So the run's teaser has to live in the description
// string, and the description string is the only part of the card that can get
// cut off mid-thought.
//
// This reverses, for the home page only, the Aug 31, 2026 decision to drop
// og:description and let Discord fall back to twitter:description. That was the
// right call when the description was a single static line repeated on every
// route. It is the wrong call now that the home page has something different to
// say each morning. Every other route still inherits the layout's tags, and the
// twitter:* tags are untouched everywhere, so the X card renders exactly as it
// did (the domain test running since Sept 12 measures one variable, and this is
// not it).
//
// BUDGET is an observed ceiling, not a documented one. Discord publishes no
// truncation limit for unfurled descriptions; the 2048 and 4096 figures quoted
// around the web are the bot API's embed limits, which is a different code
// path entirely. The number here comes from measuring a real Discord unfurl of
// a GenXKrypto X post on Sept 17, 2026, which cut mid-word at roughly 290
// characters. 280 leaves a little room. Re-measure it rather than trusting it
// if Discord's rendering changes.
export const EMBED_DESCRIPTION_BUDGET = 280;

// The opener, added Sept 17, 2026 at Phil's request after the first live card.
// Same line the X parent and the Discord teaser already lead with, so a reader
// who sees the desk in three places sees one masthead rather than three.
//
// It is a constant here rather than the first line of briefs.teaser_md for two
// reasons. It never changes, so retyping it every run is a standing chance to
// introduce a typo or an em dash into a public surface. And it is chrome, not
// content: the budget below has to know the difference so that a long teaser
// drops one of its own signals rather than silently eating the masthead.
//
// Note what it costs. At 47 characters plus the blank line beneath it, the lead
// takes roughly 49 of the 280, which is most of a signal line. That is the
// trade: the card gains the masthead and loses about one bullet's worth of room.
export const EMBED_LEAD = '\uD83D\uDCE1 From the Desk | XRP Macro Intelligence Brief';

// Default unfurl image (Discord, Slack, iMessage, LinkedIn, everything not X).
// Moved here from app/layout.jsx on Sept 17, 2026 so the layout and the home
// page's generateMetadata read one constant instead of two copies of a string
// that carries a hand-bumped cache buster. Bump the ?v= here whenever
// og-card.png changes or app/og-banner/route.jsx changes its crop.
export const OG_IMAGE = 'https://xrpmacro.com/og-banner?v=4';

const FALLBACK = 'Verified XRP and macro briefs, published with sourced receipts.';

// Discord does not parse markdown in an unfurled description, so bold markers
// would render as literal asterisks on the card. Stripped here rather than
// policed at write time, because briefs.teaser_md is also the source for the
// Discord message itself, where markdown renders fine.
function stripMarkdown(s) {
  return s.replace(/\*+/g, '');
}

function normalize(s) {
  return (s || '')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

// Fit whole lines into a budget. Cuts on line boundaries only: a teaser that
// runs long loses whole signals off the bottom, which reads as a shorter list,
// where a mid-line cut reads as broken software. The one exception is a first
// line that overruns on its own, where an ellipsis beats an empty card.
function fitLines(raw, budget) {
  const lines = raw.split('\n');
  const kept = [];
  let used = 0;

  for (const line of lines) {
    const cost = kept.length ? line.length + 1 : line.length;
    if (used + cost > budget) break;
    kept.push(line);
    used += cost;
  }

  // Never end the card on a blank line or a dangling blank separator.
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop();

  if (!kept.length) {
    const first = lines.find((line) => line.trim()) || '';
    if (!first) return '';
    return `${first.slice(0, Math.max(1, budget - 1)).trimEnd()}\u2026`;
  }

  return kept.join('\n');
}

/**
 * Build the description for a run.
 *
 * lead:true (the default) is the social card: masthead, blank line, then as
 * many whole signal lines as the remaining budget allows. lead:false is the
 * plain <meta name="description">, which Google and other search engines read
 * and where a 📡 masthead is noise rather than branding.
 */
export function buildEmbedDescription(teaser, headline, options = {}) {
  const { lead = true, budget = EMBED_DESCRIPTION_BUDGET } = options;
  const raw = stripMarkdown(normalize(teaser)) || normalize(headline) || FALLBACK;

  if (!lead) return fitLines(raw, budget);

  const reserve = EMBED_LEAD.length + 2; // the masthead plus its blank line
  const body = fitLines(raw, budget - reserve);

  // If the budget leaves no room for even a truncated first line, the masthead
  // alone is still a truthful card. It should never happen at the current
  // budget; it is here so a future budget change cannot produce a card that is
  // only a blank line.
  return body ? `${EMBED_LEAD}\n\n${body}` : EMBED_LEAD;
}

/**
 * Whether a teaser fits the card whole, with the masthead in front of it.
 *
 * Exported so the fit can be checked at publish time, before the link is
 * posted, rather than discovered on a card that has already gone out.
 * Returns { total, budget, bodyRoom, complete, droppedChars }.
 */
export function embedDescriptionFit(teaser, budget = EMBED_DESCRIPTION_BUDGET) {
  const normalized = stripMarkdown(normalize(teaser));
  const built = buildEmbedDescription(teaser, null, { budget });
  const body = built === EMBED_LEAD ? '' : built.slice(EMBED_LEAD.length + 2);
  return {
    total: built.length,
    budget,
    bodyRoom: budget - (EMBED_LEAD.length + 2),
    complete: body === normalized,
    droppedChars: Math.max(0, normalized.length - body.length),
  };
}
