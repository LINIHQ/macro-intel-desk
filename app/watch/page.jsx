import { getWatchItems } from '@/lib/supabase';
import { WATCH_STATUS, fmtDate } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import Markdown from '@/components/Markdown';

export const revalidate = 60;

// Escalated items lead, then open items. Within each group, the most recently
// touched item sits on top, so an item that moved in the latest run surfaces
// and an item that has gone quiet drifts down.
const STATUS_RANK = { escalated: 0, open: 1, resolved: 2 };

function byStatusThenActivity(a, b) {
  const rank = (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1);
  if (rank !== 0) return rank;
  return new Date(b.updated_at || b.opened_date) - new Date(a.updated_at || a.opened_date);
}

// Amendments sort by status, then by validator support (sort_value), so the
// ones closest to the 80% line sit at the top of the group.
function byStatusThenSupport(a, b) {
  const rank = (STATUS_RANK[a.status] ?? 1) - (STATUS_RANK[b.status] ?? 1);
  if (rank !== 0) return rank;
  return (b.sort_value ?? 0) - (a.sort_value ?? 0);
}

function byResolvedDate(a, b) {
  return (
    new Date(b.status_changed_date || b.updated_at || b.opened_date) -
    new Date(a.status_changed_date || a.updated_at || a.opened_date)
  );
}

const AMENDMENT_GROUP = 'xrpl_amendments';

function WatchCard({ item }) {
  const st = WATCH_STATUS[item.status] || WATCH_STATUS.open;
  return (
    <div className="card" style={item.status === 'resolved' ? { opacity: 0.7 } : undefined}>
      <div className="card-head">
        <p className="card-title">{item.title}</p>
        <StatusChip color={st.color}>{st.label}</StatusChip>
      </div>
      <Markdown>{item.detail_md}</Markdown>
      <p className="small mute mono" style={{ margin: '6px 0 0' }}>
        Opened {fmtDate(item.opened_date)}
        {item.status_changed_date ? ` · ${item.status} ${fmtDate(item.status_changed_date)}` : ''}
      </p>
      {item.resolution_note ? <p className="small dim" style={{ margin: '6px 0 0' }}>{item.resolution_note}</p> : null}
    </div>
  );
}

export default async function WatchPage() {
  const items = await getWatchItems();
  const isAmendment = (i) => i.group_key === AMENDMENT_GROUP;

  const active = items.filter((i) => i.status !== 'resolved' && !isAmendment(i)).sort(byStatusThenActivity);
  const amendments = items.filter((i) => i.status !== 'resolved' && isAmendment(i)).sort(byStatusThenSupport);
  const resolved = items.filter((i) => i.status === 'resolved').sort(byResolvedDate);

  // The support snapshot date is the most recent update across the group, so
  // the section header states exactly how fresh the percentages are.
  const amendmentStamp = amendments.reduce((latest, i) => {
    const d = i.updated_at || i.opened_date;
    return !latest || new Date(d) > new Date(latest) ? d : latest;
  }, null);

  return (
    <div>
      <h1>Watch list</h1>
      <p className="page-sub">Standing items the desk tracks from brief to brief until they resolve.</p>
      {active.length ? active.map((i) => <WatchCard key={i.id} item={i} />) : <div className="empty">Nothing open right now.</div>}
      {amendments.length ? (
        <>
          <h2>XRPL amendments</h2>
          <p className="page-sub" style={{ marginBottom: 14 }}>
            Every amendment in validator voting on the XRP Ledger. An amendment activates two weeks after holding 80% support.
            Support figures are the desk&apos;s snapshot from XRPScan
            {amendmentStamp ? ` as of ${fmtDate(String(amendmentStamp).slice(0, 10))}` : ''}, refreshed with each brief.
          </p>
          {amendments.map((i) => <WatchCard key={i.id} item={i} />)}
        </>
      ) : null}
      {resolved.length ? (
        <>
          <h2>Resolved</h2>
          {resolved.map((i) => <WatchCard key={i.id} item={i} />)}
        </>
      ) : null}
    </div>
  );
}
