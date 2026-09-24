import { getWatchItems } from '@/lib/supabase';
import { WATCH_STATUS, fmtDate } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import LazyDetail from '@/components/LazyDetail';
import AmendmentsPanel from '@/components/AmendmentsPanel';

// Purged on demand at publish by /api/revalidate; the number below is only a
// backstop for the case where that call never lands.
//
// History: 60s until Sept 11, 2026, then 300s. Supabase request logs for a
// single 24-hour window showed 201 regenerations here against content that
// changed once, when a brief published. The amendments panel underneath
// caches its own XRPScan fetch for an hour regardless, so the page timer was
// never buying freshness for the half of this page that moves most.
export const revalidate = 3600;

// Sept 24, 2026: the open list is grouped by subject and each card opens
// collapsed. Before this, every active item rendered its full detail record in
// one flat list. At about fifty items and 64,000 characters of detail, the page
// had become a backlog to scroll rather than a list to scan, and on a phone the
// items at the bottom were effectively unreachable. Now a card shows the title,
// its status, and the first line of its record; the full record is a tap away
// and is parsed only when opened (LazyDetail). Nothing is hidden and nothing is
// filtered out: the same rows render, in a shape a reader can actually cover.
//
// Group keys are the watch_items.group_key column. The order below is fixed so
// the page reads the same way every day: the physical and market gauges first,
// then regulation and the XRP-specific threads, then general geopolitics. A key
// not listed here still renders, after the known groups, under its raw key.
const GROUPS = [
  ['hormuz', 'Hormuz'],
  ['oil', 'Oil'],
  ['yen_carry_trade', 'Yen carry / RCT'],
  ['bond_market_stress', 'Bond stress'],
  ['global_liquidity', 'Global liquidity'],
  ['global_risk_appetite', 'Risk appetite'],
  ['regulation', 'Regulation'],
  ['xrp_institutional', 'XRP institutional'],
  ['xrp_fundamentals', 'XRP flows'],
  ['ripple_corporate', 'Ripple corporate'],
  ['geopolitics', 'Geopolitics'],
];
const GROUP_LABEL = Object.fromEntries(GROUPS);
const GROUP_RANK = Object.fromEntries(GROUPS.map(([k], i) => [k, i]));

// Escalated items lead, then open items. Within each, the most recently
// touched item sits on top, so an item that moved in the latest run surfaces
// and an item that has gone quiet drifts down.
const STATUS_RANK = { escalated: 0, open: 1, resolved: 2 };

function byStatusThenActivity(a, b) {
  const rank = (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1);
  if (rank !== 0) return rank;
  return new Date(b.updated_at || b.opened_date) - new Date(a.updated_at || a.opened_date);
}

function byResolvedDate(a, b) {
  return (
    new Date(b.status_changed_date || b.updated_at || b.opened_date) -
    new Date(a.status_changed_date || a.updated_at || a.opened_date)
  );
}

// First paragraph of the record as plain text, for the collapsed card. Strips
// list markers, bold and link syntax; the full markdown still renders on open.
function leadLine(md) {
  if (!md) return '';
  const para = String(md).split(/\n\s*\n/)[0] || '';
  return para
    .replace(/\n+/g, ' ')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function WatchCard({ item }) {
  const st = WATCH_STATUS[item.status] || WATCH_STATUS.open;
  const resolved = item.status === 'resolved';
  return (
    <div className="card" style={resolved ? { opacity: 0.7 } : undefined}>
      <div className="card-head">
        <p className="card-title">{item.title}</p>
        <StatusChip color={st.color}>{st.label}</StatusChip>
      </div>
      <p
        className="dim"
        style={{
          margin: '2px 0 0',
          fontSize: 13.5,
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {leadLine(item.detail_md)}
      </p>
      <LazyDetail md={item.detail_md} label="Full record" />
      <p className="small mute mono" style={{ margin: '6px 0 0' }}>
        Opened {fmtDate(item.opened_date)}
        {item.status_changed_date ? ` · ${item.status} ${fmtDate(item.status_changed_date)}` : ''}
      </p>
      {item.resolution_note ? <p className="small dim" style={{ margin: '6px 0 0' }}>{item.resolution_note}</p> : null}
    </div>
  );
}

function groupActive(items) {
  const map = new Map();
  for (const it of items) {
    const k = it.group_key || 'other';
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  const keys = [...map.keys()].sort((a, b) => {
    const ra = GROUP_RANK[a] ?? 99;
    const rb = GROUP_RANK[b] ?? 99;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  return keys.map((k) => ({
    key: k,
    label: GROUP_LABEL[k] || (k === 'other' ? 'Other' : k),
    items: map.get(k).sort(byStatusThenActivity),
  }));
}

export default async function WatchPage() {
  const items = await getWatchItems();
  const active = items.filter((i) => i.status !== 'resolved');
  const resolved = items.filter((i) => i.status === 'resolved').sort(byResolvedDate);
  const escalated = active.filter((i) => i.status === 'escalated').length;
  const groups = groupActive(active);

  return (
    <div>
      <h1>Watch list</h1>
      {/* The subtitle names both things on this page in the order they appear.
          It used to describe only the standing items, which left the amendment
          table sitting above it looking unaccounted for. */}
      <p className="page-sub">
        Live XRPL amendment voting, then the standing items the desk tracks from brief to brief
        until they resolve.
      </p>
      <AmendmentsPanel />

      <h2>Open items</h2>
      {active.length ? (
        <p className="small mute" style={{ margin: '-6px 0 14px' }}>
          {active.length} open{escalated ? `, ${escalated} escalated` : ''}, grouped by subject. Tap a card for
          its full record.
        </p>
      ) : null}
      {active.length ? (
        groups.map((g) => (
          <section key={g.key} style={{ margin: '0 0 22px' }}>
            <p
              className="small mute"
              style={{ margin: '0 0 8px', letterSpacing: '0.13em', textTransform: 'uppercase' }}
            >
              {g.label} · {g.items.length}
            </p>
            {g.items.map((i) => (
              <WatchCard key={i.id} item={i} />
            ))}
          </section>
        ))
      ) : (
        <div className="empty">Nothing open right now.</div>
      )}

      {resolved.length ? (
        <>
          <h2>Resolved</h2>
          {resolved.map((i) => (
            <WatchCard key={i.id} item={i} />
          ))}
        </>
      ) : null}
    </div>
  );
}
