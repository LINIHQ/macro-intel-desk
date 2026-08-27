import { getLatestBrief } from '@/lib/supabase';
import { fmtDate, CATEGORIES, stateFor } from '@/lib/format';
import ShareCard from '@/components/ShareCard';

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
        Download and attach to the parent post. The link goes in a reply.
      </p>
      <ShareCard
        dateLabel={fmtDate(brief.run_date)}
        modeLabel={modeLabel}
        runDate={brief.run_date}
        gauges={gauges}
        items={items}
      />
    </div>
  );
}
