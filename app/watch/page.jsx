import { getWatchItems } from '@/lib/supabase';
import { WATCH_STATUS, fmtDate } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import Markdown from '@/components/Markdown';
import AmendmentsPanel from '@/components/AmendmentsPanel';

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

function byResolvedDate(a, b) {
  return (
    new Date(b.status_changed_date || b.updated_at || b.opened_date) -
    new Date(a.status_changed_date || a.updated_at || a.opened_date)
  );
}

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
  const active = items.filter((i) => i.status !== 'resolved').sort(byStatusThenActivity);
  const resolved = items.filter((i) => i.status === 'resolved').sort(byResolvedDate);

  return (
    <div>
      <h1>Watch list</h1>
      <p className="page-sub">Standing items the desk tracks from brief to brief until they resolve.</p>
      {active.length ? active.map((i) => <WatchCard key={i.id} item={i} />) : <div className="empty">Nothing open right now.</div>}
      <h2>XRPL amendments</h2>
      <AmendmentsPanel />
      {resolved.length ? (
        <>
          <h2>Resolved</h2>
          {resolved.map((i) => <WatchCard key={i.id} item={i} />)}
        </>
      ) : null}
    </div>
  );
}
