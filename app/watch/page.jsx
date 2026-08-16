import { getWatchItems } from '@/lib/supabase';
import { WATCH_STATUS, fmtDate } from '@/lib/format';
import StatusChip from '@/components/StatusChip';
import Markdown from '@/components/Markdown';

export const revalidate = 60;

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
  const active = items.filter((i) => i.status !== 'resolved');
  const resolved = items.filter((i) => i.status === 'resolved');

  return (
    <div>
      <h1>Watch list</h1>
      <p className="page-sub">Standing items the desk tracks across runs until they resolve.</p>
      {active.length ? active.map((i) => <WatchCard key={i.id} item={i} />) : <div className="empty">Nothing open right now.</div>}
      {resolved.length ? (
        <>
          <h2>Resolved</h2>
          {resolved.map((i) => <WatchCard key={i.id} item={i} />)}
        </>
      ) : null}
    </div>
  );
}
