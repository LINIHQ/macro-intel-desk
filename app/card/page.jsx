import { getLatestBrief } from '@/lib/supabase';
import { fmtDate, CATEGORIES, stateFor } from '@/lib/format';
import ShareCard from '@/components/ShareCard';
import LinkPreviewCard from '@/components/LinkPreviewCard';

export const revalidate = 60;

export const metadata = {
  title: 'Share card',
  robots: { index: false, follow: false },
};

export default async function CardPage() {
  const brief = await getLatestBrief();

  if (!brief) {
    return (
      <div>
        <h1>Share card</h1>
        <div className="empty">No published briefs yet. The card will appear here.</div>
      </div>
    );
  }

  const gauges = CATEGORIES.map((c) => {
    const s = stateFor(brief.dashboard_states, c.key);
    return { label: c.label, level: s?.level ?? null, value: s?.label ?? '' };
  });

  const items = [...(brief.brief_items || [])]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((it) => ({ rank: it.rank, title: it.title, verification: it.verification }));

  const modeLabel = brief.brief_mode === 'full' ? 'Full brief' : 'Quick brief';

  return (
    <div>
      <h1>Share card</h1>
      <p className="page-sub">
        Daily image for the X drop, built from the latest published brief ({fmtDate(brief.run_date)}).
        Download and attach to the parent post. The link goes in the reply.
      </p>
      <ShareCard
        dateLabel={fmtDate(brief.run_date)}
        modeLabel={modeLabel}
        runDate={brief.run_date}
        gauges={gauges}
        items={items}
      />

      <h2 style={{ marginTop: 48 }}>Link preview cards</h2>
      <p className="page-sub">
        Static images behind the site link unfurl. These are not daily: download once,
        commit to public/ as og-card.png and og-card-x.png, then the layout metadata
        flips to point at them. Default carries the domain; the X variant keeps the
        bottom band clear so the X title chip lands on empty background.
      </p>
      <LinkPreviewCard variant="default" />
      <LinkPreviewCard variant="x" />
    </div>
  );
}
