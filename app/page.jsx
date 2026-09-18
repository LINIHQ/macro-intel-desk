import Link from 'next/link';
import {
  getLatestBrief,
  getLatestBriefMeta,
  getClassificationHistory,
  getCurrentCriteria,
} from '@/lib/supabase';
import { buildEmbedDescription, OG_IMAGE } from '@/lib/embed';
import { fmtDate, fmtRunStamp } from '@/lib/format';
import DashboardGrid from '@/components/DashboardGrid';
import BriefBody from '@/components/BriefBody';
import BriefStats from '@/components/BriefStats';
import CrowdGauge from '@/components/CrowdGauge';
import LivePrice from '@/components/LivePrice';
import ShareBlock from '@/components/ShareBlock';
import BriefAlertsToggle from '@/components/BriefAlertsToggle';
import { AmendmentsStrip } from '@/components/AmendmentsPanel';

export const revalidate = 60;

// Per-run link previews for the live page (Sept 17, 2026).
//
// Until now every route served the same static description from app/layout.jsx,
// so a pasted xrpmacro.com link said the same sentence on any day of the week.
// Here the home page serves the run's own teaser instead, which is the whole
// point: a bare link becomes worth posting on its own, because the card carries
// the day's signals rather than a permanent tagline.
//
// Four things to know before changing this.
//
// One, Next merges metadata shallowly. This openGraph object REPLACES the
// layout's rather than extending it, so every field it needs has to be restated
// here, images included. Drop one and it disappears from the home page's card
// while every other route keeps it, which is a confusing bug to chase.
//
// Two, twitter:* is deliberately absent. The layout's X card tags pass straight
// through untouched, so the X card renders exactly as it did. The domain test
// running since Sept 12 has one variable in it and this is not allowed to
// become a second one.
//
// Three, the social card and the search-engine description are not the same
// string. The card leads with the 📡 masthead (lib/embed.js EMBED_LEAD); the
// plain <meta name="description"> that Google reads does not, because there a
// masthead is noise sitting in front of the only line that does any work.
//
// Four, Discord caches an unfurl by exact URL, for anywhere from twenty minutes
// to several hours, and offers no way to flush it. Posting bare xrpmacro.com
// every morning will show the previous run's card. Post a dated parameter
// instead (xrpmacro.com/?b=0917): the query string changes the cache key
// without changing the page.
export async function generateMetadata() {
  let brief = null;
  try {
    brief = await getLatestBriefMeta();
  } catch {
    // A failed read here must not take the page down with it. Falling through
    // leaves the layout's static description in place: stale, but true.
    return {};
  }
  if (!brief) return {};

  const cardDescription = buildEmbedDescription(brief.teaser_md, brief.headline);
  const metaDescription = buildEmbedDescription(brief.teaser_md, brief.headline, { lead: false });

  return {
    description: metaDescription,
    openGraph: {
      title: 'XRP Macro Intelligence Desk',
      description: cardDescription,
      url: '/',
      type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 488, alt: 'XRP Macro Intelligence Desk' }],
    },
  };
}

// Publication time (Sept 18, 2026). Briefs are staged with published = false
// and flipped live after review, so created_at is when the row was staged, not
// when readers could see it. On Sept 18 the header read "Published 9:53 AM"
// (the insert) for a brief that went live at 10:00, beside an evidence stamp
// that therefore looked later than publication. briefs.published_at is set by
// a database trigger on the first false-to-true flip and never moves after.
// Rows published before the column existed have it null and fall back to
// created_at, which was their only recorded time; no flip times are guessed
// into the archive.
function publishedIsoOf(brief) {
  return brief.published_at || brief.created_at;
}

// Date and time are split so a stamp landing on the same ET day as the brief can
// drop its date and show the time alone. The header stamps are uppercase and
// letter-spaced, which eats width fast: at 375px a full "Evidence verified
// through Sep 8, 12:00 PM ET" wrapped and orphaned the ET onto its own line.
function etParts(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    }),
    time: d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }),
    weekday: d.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'America/New_York',
    }),
  };
}

function stampText(iso, sameDayAsIso) {
  const p = etParts(iso);
  if (!p) return null;
  const ref = etParts(sameDayAsIso);
  return ref && ref.date === p.date ? p.time : `${p.date}, ${p.time}`;
}

// Week-ending header (Sept 13, 2026). A week-ending summary is dated for the
// Friday it covers (fmtDate(brief.run_date)) but written and published the
// next morning. The standard two-line header put "Sep 11" directly above
// "Published Sep 12" with nothing on the page explaining the gap, so new
// visitors read it as a stale page rather than the weekly cadence it is.
// Week-ending mode drops the Friday run date from this header entirely (it
// still shows on the permalink and archive) and leads with the one date a
// reader actually needs, publish day, folding each stamp's weekday name in
// so "Sat" next to "Fri" explains the one-day gap on its own.
//
// withDate=true always spells out the date (used for Published, the header's
// one anchor date). withDate=false is weekday+time only (used for Evidence,
// which is deliberately date-free next to Saturday's publish date).
function weStamp(iso, withDate) {
  const p = etParts(iso);
  if (!p) return null;
  return withDate ? `${p.weekday}, ${p.date}, ${p.time}` : `${p.weekday}, ${p.time}`;
}

// The Updated stamp is nearly always the same Saturday as Published, so it
// drops its date too, but a correction issued days later (rare, but real
// under the corrections protocol) still needs its own date rather than
// silently reading as same-day.
function weUpdatedStamp(iso, refIso) {
  const p = etParts(iso);
  if (!p) return null;
  const ref = etParts(refIso);
  const sameDay = ref && ref.date === p.date;
  return sameDay ? `${p.weekday}, ${p.time}` : `${p.weekday}, ${p.date}, ${p.time}`;
}

// A week-ending summary is the only brief mode this desk publishes on a
// different ET calendar date than the one it's dated for (Friday run_date,
// Saturday publication). brief_mode === 'full' is required alongside the date
// check so a same-day full brief run for depth on a weekday never picks up
// the week-ending header by accident.
function isWeekEndingBrief(brief) {
  const pubIso = publishedIsoOf(brief);
  if (brief.brief_mode !== 'full' || !pubIso || !brief.run_date) return false;
  const etDate = new Date(pubIso).toLocaleDateString('en-CA', {
    timeZone: 'America/New_York',
  });
  return etDate !== brief.run_date;
}

// Each stamp is kept whole so a narrow screen can only break between stamps,
// at the separator, never inside one.
const NOWRAP = { whiteSpace: 'nowrap' };

export default async function LivePage() {
  const [brief, history, criteria] = await Promise.all([
    getLatestBrief(),
    getClassificationHistory(),
    getCurrentCriteria(),
  ]);

  if (!brief) {
    return (
      <div>
        <h1>Macro dashboard</h1>
        <div className="empty">No published briefs yet. The first brief will appear here.</div>
      </div>
    );
  }

  const shareUrl = 'https://xrpmacro.com';
  const shareText = brief.headline
    ? `XRP Macro Brief: ${brief.headline}`
    : 'XRP Macro Intelligence Desk';
  const publishedIso = publishedIsoOf(brief);
  const runStamp = fmtRunStamp(publishedIso, brief.run_date);
  const weekEnding = isWeekEndingBrief(brief);

  // Publication time, evidence cutoff and last edit are three different facts and
  // stay three different facts, on two lines. The evidence stamp leads, beside the
  // date, because it is the one that makes every number in the brief auditable.
  // Publication and the edit stamp share the second line, with ET written once at
  // the end when both are present; the edit stamp only appears when an edit
  // happened. Brief mode is not shown here: on the live page it told the reader
  // nothing, and it remains on the archive and on each permalink.
  const verifiedText = stampText(brief.evidence_verified_through, publishedIso);
  const updatedText =
    brief.last_updated_at && brief.last_updated_at !== publishedIso
      ? stampText(brief.last_updated_at, publishedIso)
      : null;
  const pubText = runStamp
    ? updatedText
      ? runStamp.replace(/\s*ET$/, '')
      : runStamp
    : null;

  // Week-ending stamps: see weStamp/weUpdatedStamp above. Published always
  // shows in full; Evidence is always weekday+time only; Updated matches
  // Published's date unless the edit landed on a different day.
  const wePubText = weekEnding ? weStamp(publishedIso, true) : null;
  const weVerifiedText = weekEnding ? weStamp(brief.evidence_verified_through, false) : null;
  const weUpdatedText =
    weekEnding && brief.last_updated_at && brief.last_updated_at !== publishedIso
      ? weUpdatedStamp(brief.last_updated_at, publishedIso)
      : null;

  const itemsNote = (
    <p className="small mute" style={{ margin: '2px 0 14px' }}>
      Ranked by weight, tagged by verdict. Every item carries its own sources.
    </p>
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Macro dashboard</h1>
          {weekEnding ? (
            <>
              <p className="page-meta" style={{ marginBottom: 0 }}>
                Week ending summary
              </p>
              <p className="page-meta" style={{ marginTop: 2 }}>
                {wePubText ? (
                  <span style={NOWRAP}>
                    Published {wePubText}
                    {weVerifiedText ? '' : ' ET'}
                  </span>
                ) : null}
                {wePubText && weVerifiedText ? ' · ' : null}
                {weVerifiedText ? (
                  <span style={NOWRAP}>Evidence through {weVerifiedText} ET</span>
                ) : null}
              </p>
              {weUpdatedText ? (
                <p className="page-meta" style={{ marginTop: 2 }}>
                  <span style={NOWRAP}>Updated {weUpdatedText} ET</span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="page-meta" style={{ marginBottom: 0 }}>
                <span style={NOWRAP}>{fmtDate(brief.run_date)}</span>
                {verifiedText ? (
                  <>
                    {' · '}
                    <span style={NOWRAP}>Evidence through {verifiedText} ET</span>
                  </>
                ) : null}
              </p>
              {pubText || updatedText ? (
                <p className="page-meta" style={{ marginTop: 2 }}>
                  {pubText ? <span style={NOWRAP}>Published {pubText}</span> : null}
                  {pubText && updatedText ? ' · ' : null}
                  {updatedText ? <span style={NOWRAP}>Updated {updatedText} ET</span> : null}
                </p>
              ) : null}
            </>
          )}
        </div>
        {/* Sept 13, 2026: LivePrice joins CrowdGauge as a pair of live-context
            widgets, live page only, never on a brief permalink. Deliberately
            separate from the brief's own frozen "XRP spot" stamp inside Where
            things stand: that figure is what the brief's gauges and math were
            built from and stays auditable at write time; this is what the
            market is doing right now. See components/LivePrice.jsx. */}
        <div className="head-widgets">
          <LivePrice />
          <CrowdGauge />
        </div>
      </div>

      {/* Sept 13, 2026: the cadence/attribution note and the alerts toggle now
          share one .sec panel instead of each carrying its own left-accent
          border. Both predate the polish pass and read as unboxed next to
          everything else on the page once tiles, cards and section headers all
          picked up the rounded-panel treatment. The toggle keeps its own
          .alerts-row styling for the divider between the two, now a top border
          rather than a second left accent (see globals.css). */}
      <div className="sec" style={{ margin: '10px 0 22px' }}>
        <p className="small mute" style={{ margin: 0, letterSpacing: '0.02em' }}>
          Morning brief drops Mon-Fri, 9-10am ET · Week-ending summary Saturday morning
        </p>
        <p className="small mute" style={{ margin: '7px 0 0', letterSpacing: '0.02em' }}>
          {/* Sept 13, 2026: "run independently" trimmed to "run by" since the
              positioning triplet right after it already says "Independent" on
              its own; the two sat one clause apart and read as the same word
              said twice. The triplet itself (Free / Independent / Not
              financial advice) stays exactly as written, it matches the same
              line on the daily share card footer. */}
          Built and run by{' '}
          <a className="quiet-link" href="https://x.com/GenXKrypto" target="_blank" rel="noopener noreferrer">
            GenXKrypto
          </a>
          {' '}· Free · Independent · Not financial advice
        </p>
        <BriefAlertsToggle />
      </div>

      {/* Hero readouts (Sept 13, 2026): gauges changed, ranked items, trend
          arrows, all drawn from the brief already fetched above. XRP spot moved
          out of this strip and up to the live widget pair above; this strip is
          exclusively the brief's own recorded counts now. Sits directly over
          the gauge grid so the page opens on numbers, then colour. */}
      <BriefStats brief={brief} />

      <p className="gauge-hint">
        <span className="hint-touch">Tap</span><span className="hint-pointer">Click</span> any gauge for analysis ↓
      </p>
      <DashboardGrid
        states={brief.dashboard_states}
        history={history}
        criteria={criteria}
        verifiedThrough={brief.evidence_verified_through}
      />

      {brief.headline ? (
        <div className="term-box">
          <span className="term-prompt">&gt;_</span>
          <p>{brief.headline}</p>
        </div>
      ) : null}

      <AmendmentsStrip />

      <BriefBody brief={brief} itemsNote={itemsNote} />

      <ShareBlock url={shareUrl} text={shareText} />

      <p className="small mute" style={{ marginTop: 28 }}>
        Past briefs live in the <Link href="/archive">archive</Link>. Status shifts over time are on the{' '}
        <Link href="/history">history</Link> page. Every gauge test and every revision to one is on the{' '}
        <Link href="/methodology">criterion register</Link>.
      </p>
    </div>
  );
}
