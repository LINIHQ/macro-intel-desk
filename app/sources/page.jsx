import Link from 'next/link';
import StatusChip from '@/components/StatusChip';
import { VERIFICATION } from '@/lib/format';

export const metadata = {
  title: 'Sources | GenXKrypto XRP Macro Intelligence Desk',
};

export default function SourcesPage() {
  return (
    <div>
      <h1>Sources</h1>
      <p className="page-sub">
        Where this desk's information comes from, how it gets verified, and the rules it publishes under. This is an
        intelligence product, not a confirmation-bias engine, and not investment advice.
      </p>

      <h2>Who runs this</h2>
      <p>
        The XRP Macro Intelligence Desk is built and run independently by{' '}
        <a href="https://x.com/GenXKrypto" target="_blank" rel="noopener noreferrer">GenXKrypto</a>, who has been in
        crypto since 2016. Free. Independent. Not financial advice.
      </p>
      <p>
        The desk currently runs with no ads and no sponsors. If that ever changes it will be disclosed here, and no
        sponsor will ever influence a gauge, verdict, or claim.
      </p>

      <h2>Publishing cadence</h2>
      <p>
        A morning brief drops each weekday, Monday through Friday, 9-10am ET. A full week-ending brief publishes
        Saturday morning, dated by the Friday it covers, after Friday's market close and the weekly flow data the
        morning brief cannot capture. Breaking developments material enough to warrant it are folded into the next
        scheduled brief.
      </p>

      <h2>Source hierarchy</h2>
      <p>
        <strong>Tier 1, primary and authoritative:</strong> the Federal Reserve, Bank of Japan, Japan Ministry of
        Finance, U.S. Treasury, OCC, SEC, CFTC, FDIC, BIS, DTCC, official government and military statements, Ripple
        and official XRPL sources, ETF issuer disclosures, corporate filings, and regulatory documents. Preferred
        whenever available.
      </p>
      <p>
        <strong>Tier 2, high-quality news:</strong> Reuters, CNBC, the Associated Press, and other reputable financial
        publications, plus Bloomberg, the Financial Times, and the Wall Street Journal when their content is actually
        accessible. Paywalled content is never cited beyond what was readable.
      </p>
      <p>
        <strong>Tiers 3 and 4, social intelligence and commentary:</strong> a defined watch list of X accounts,
        Truth Social, and YouTube commentary channels. These are treated as lead generators and narrative trackers,
        never as confirmation. A social post is not evidence; significant claims from these tiers are independently
        checked against Tier 1 and 2 sources before appearing in a brief, and commentary is always labeled as
        commentary.
      </p>
      <p>
        <strong>Live data feeds:</strong> the Crypto Market Fear &amp; Greed reading on the dashboard is supplied by
        CoinMarketCap's Fear &amp; Greed Index, with Alternative.me's index as fallback when CMC is unavailable.
        Sentiment gauges are crowd readings, not desk verdicts, and they carry no evidentiary weight in briefs.
      </p>
      <p>
        Where a verdict rests on specific sources, briefs and claims display them as clickable links so readers can
        check the receipts directly. Source links appear on content published from August 16, 2026 onward; earlier
        archival entries predate the practice and are never given fabricated links.
      </p>

      <h2>Verification taxonomy</h2>
      <p>Every consequential claim in every brief carries one of five verdicts. They mean exactly this, every time:</p>
      <div className="card">
        <p style={{ margin: '0 0 10px' }}>
          <StatusChip color={VERIFICATION.verified.color}>Verified</StatusChip>{' '}
          <span className="dim">Primary documentation or multiple highly credible sources confirm it.</span>
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <StatusChip color={VERIFICATION.partially_verified.color}>Partially verified</StatusChip>{' '}
          <span className="dim">Some credible evidence exists but important details remain unresolved.</span>
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <StatusChip color={VERIFICATION.unverified.color}>Unverified</StatusChip>{' '}
          <span className="dim">Circulating, but reliable confirmation has not been located. Unverified means unverified.</span>
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <StatusChip color={VERIFICATION.contradicted.color}>Contradicted</StatusChip>{' '}
          <span className="dim">
            Reliable evidence contradicts the claim. Stale stories recirculated as new developments land here too.
          </span>
        </p>
        <p style={{ margin: 0 }}>
          <StatusChip color={VERIFICATION.opinion.color}>Opinion</StatusChip>{' '}
          <span className="dim">Analysis, prediction, or interpretation rather than a factual event.</span>
        </p>
      </div>
      <p>
        <strong>Claims are scoped so the badge covers the whole sentence.</strong> A claim is worded narrowly enough
        that its verdict applies to every part of it. Where a confirmed event contains an unconfirmed detail, the
        detail is held in the evidence body and does not ride on the verdict. A primary document that is silent on a
        claim fails to support it, which is Unverified; Contradicted requires reliable evidence against the claim, not
        the absence of evidence for it. Where an existing claim mixes scopes it is split into separate claims rather
        than reworded, and the original text stays on the record with a dated note. This rule took effect September 8,
        2026 and is logged in the changelog on the{' '}
        <Link href="/methodology">criterion register</Link>.
      </p>
      <p>
        Verdicts change when evidence changes, and every change is appended to the public record on the claims page
        rather than overwritten. A verdict that moves against a popular narrative publishes with the same prominence
        as one that supports it.
      </p>

      <h2>Dashboard classifications</h2>
      <p>
        The eight-category dashboard uses a four-level scale (green, yellow, orange, red). Classifications change only
        on observable evidence, never to make a report more interesting, and every change is recorded with its reason
        on the history page.
      </p>
      <p>
        <strong>What the four levels mean.</strong> Green is baseline: conditions normal or supportive, nothing
        demanding attention. Yellow is watch: early signals worth tracking, not yet confirmed by hard evidence. Orange
        is elevated: verified evidence of active stress or deterioration, the variable is moving. Red is regime-level:
        disruption or stress severe enough to change the macro picture, declared only on confirmed events, never on
        headlines alone.
      </p>
      <p>
        <strong>How a level gets set.</strong> Every classification rests on evidence verified during that brief from
        Tier 1 and 2 sources: actual prices, yields, flows, official statements, and confirmed events, never social
        sentiment or narrative volume. A category does not move because the news cycle got loud.
      </p>
      <p>
        <strong>Pre-registered criteria.</strong> Any category sitting at orange or red publishes its "Moves if"
        conditions in the brief: the specific, checkable evidence (numeric levels or named events) that would move it
        one level in either direction. When a classification later changes, the recorded reason on the history page
        states whether a pre-registered criterion fired or whether the move came from evidence that was not
        pre-registered. The criteria are written before the move, so the desk cannot quietly rationalize a change
        after the fact.
      </p>
      <p>
        <strong>Criteria get revised, and the revisions are published too.</strong> A test that can be rewritten
        silently is not really pre-registered. Every criterion the desk has published, current and retired, is on the{' '}
        <Link href="/methodology">criterion register</Link> with its old wording, the date it took effect, the brief
        it took effect in, and the reason it changed. Criteria are never edited in place: a revision inserts a new
        record and stamps the one it replaces. The register was created September 8, 2026 and backfilled from
        published brief text; where a revision's reason was not recorded at the time, the entry says so rather than
        supplying one after the fact.
      </p>
      <p>
        <strong>Trend arrows.</strong> A small arrow and note on a dashboard tile mean a pre-registered criterion is
        partially met or a tracked level is converging on a trigger. The arrow describes movement toward or away from
        a threshold; the classification itself changes only when the criterion actually fires. No arrow means no
        criterion is in motion.
      </p>
      <p>
        <strong>Classification history on the tiles.</strong> The small bar strip on each dashboard tile is recorded
        data, not decoration. Each segment is one published brief's classification for that category, oldest on the
        left and newest on the right, over the same window and the same scale on all eight tiles so they can be read
        against each other. Higher means more adverse. A flat strip means the classification did not change, and
        nothing is added to make it look busier. Tap or hover a segment in an expanded tile for its date and status.
        Segments show what was published at the time and are never backdated; corrections appear in the brief instead.
        Until September 8, 2026 these strips were a stylized motif whose shape carried no data. That was a mistake on
        a desk that publishes on evidence, and it was replaced rather than relabeled.
      </p>
      <p>
        The XRP flows gauge is a composite of demand-side signals: ETF flows and institutional holdings, exchange
        balances, market structure and liquidity, plus XRPL utility and regulatory posture where they touch the token.
        It measures buying and selling pressure around XRP, not the health of the ledger itself.
      </p>
      <p>
        The macro backdrop gauge grades the macro conditions surrounding XRP: rates, oil, liquidity, and policy. It is
        a verdict on the environment, not on XRP itself, which is why it can sit at unfavorable while XRP rallies, or
        favorable while XRP falls. It displayed as "XRP macro environment" until August 21, 2026; the rename changed
        the display label only, and the category's criteria, scale, and full history are unchanged.
      </p>

      <h2>Honesty rules</h2>
      <p>
        No invented quotes, prices, statistics, government statements, regulatory decisions, ETF flows, partnerships,
        military events, market movements, or social-media posts. If a number cannot be sourced, it does not appear.
        "This could not be verified" is treated as a valuable conclusion, not a failure.
      </p>
      <p>
        The desk tracks XRP and Ripple as separate variables: corporate wins are not automatically token demand, and
        briefs say so when the connection is missing. The desk also actively searches for evidence against the theses
        its readers like. That is the point.
      </p>
      <p>
        Corrections are additive. The original text stays on the page and a dated correction note is appended
        underneath it, so the record cannot be groomed to look like the desk was always right. The claim tracker's
        verdict history is append-only. Archival entries reconstructed from past briefs say so explicitly, and
        unrecovered sections are omitted rather than rewritten.
      </p>

      <h2>What this is not</h2>
      <p>
        Not financial advice, not investment recommendations, and not monetized. No point-price predictions are made
        with confidence; scenarios come with assumptions and invalidation conditions. This desk exists so anyone
        tracking XRP and the macro forces around it can read verified intelligence with the receipts attached.
      </p>
    </div>
  );
}
