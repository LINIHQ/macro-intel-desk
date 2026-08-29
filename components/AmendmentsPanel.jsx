// Live XRPL amendment voting, fetched server-side from XRPScan and cached
// for an hour. Shows every amendment open for voting on mainnet: not yet
// enabled, still supported by the current release, not deprecated.
// Amendments need 80% validator support held for two weeks to activate.

const XRPSCAN_URL = 'https://api.xrpscan.com/api/v1/amendments';
const RIPPLE_EPOCH_MS = Date.UTC(2000, 0, 1);
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function rippleTimeToDate(seconds) {
  return new Date(RIPPLE_EPOCH_MS + seconds * 1000);
}

function fmtEtDate(d) {
  return d.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
}

function fmtEtStamp(d) {
  const tz = { timeZone: 'America/New_York' };
  const day = d.toLocaleDateString('en-US', { ...tz, month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { ...tz, hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time} ET`;
}

async function fetchVoting() {
  try {
    const res = await fetch(XRPSCAN_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const all = await res.json();
    return all
      .filter((a) => !a.enabled && a.supported && !a.deprecated)
      .map((a) => ({
        id: a.amendment_id,
        name: a.name,
        xls: a.xls || null,
        introduced: a.introduced || null,
        count: a.count ?? 0,
        threshold: a.threshold ?? 0,
        validations: a.validations ?? 0,
        majorityAt: a.majority ? rippleTimeToDate(a.majority) : null,
      }))
      .sort((x, y) => y.count - x.count || x.name.localeCompare(y.name));
  } catch {
    return null;
  }
}

export default async function AmendmentsPanel() {
  const rows = await fetchVoting();
  const fetchedAt = new Date();

  if (!rows) {
    return (
      <div className="amend">
        <div className="amend-head">
          <span className="amend-title">XRPL amendment voting</span>
        </div>
        <p className="small dim" style={{ margin: 0 }}>Vote data unavailable right now (XRPScan did not respond). The desk does not estimate missing figures.</p>
      </div>
    );
  }

  const majority = rows.filter((r) => r.majorityAt).length;

  return (
    <div className="amend">
      <div className="amend-head">
        <span className="amend-title">XRPL amendment voting</span>
        <span className="amend-meta">{rows.length} in voting · {majority} at majority · XRPScan, {fmtEtStamp(fetchedAt)}</span>
      </div>
      <div className="amend-cols small mute mono" aria-hidden="true">
        <span>Amendment</span><span className="amend-xls">XLS</span><span className="amend-votes">Votes</span><span>Support</span>
      </div>
      {rows.map((r) => {
        const pct = r.validations ? (r.count / r.validations) * 100 : 0;
        const atMajority = Boolean(r.majorityAt);
        const activation = atMajority ? new Date(r.majorityAt.getTime() + TWO_WEEKS_MS) : null;
        return (
          <div className="amend-row" key={r.id}>
            <span className="amend-name">
              {r.name}
              {atMajority ? <span className="amend-date">majority {fmtEtDate(r.majorityAt)} · earliest activation {fmtEtDate(activation)}</span> : null}
            </span>
            <span className="amend-xls small dim mono">{r.xls || ''}</span>
            <span className="amend-votes small mono">
              <span style={{ color: atMajority ? 'var(--g)' : 'var(--y)', fontWeight: 600 }}>{r.count}</span>
              <span className="mute"> / {r.threshold} of {r.validations}</span>
            </span>
            <span className="amend-bar-wrap">
              <span className="amend-pct small mono">{pct.toFixed(1)}%</span>
              <span className="amend-bar"><span className="amend-fill" style={{ width: `${Math.min(pct, 100)}%`, background: atMajority ? 'var(--g)' : 'var(--y)' }} /></span>
            </span>
          </div>
        );
      })}
      <p className="small mute" style={{ margin: '10px 0 0' }}>
        An amendment activates once it holds 80% validator support for two weeks. Already-enabled amendments are not shown. Votes are counts on the default validator list.
      </p>
    </div>
  );
}
