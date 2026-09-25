// Live XRPL amendment voting, fetched server-side and cached for 15 minutes.
//
// Three reads, each doing the one job it is reliable for:
//   1. Majorities and the enabled set come from the ledger's own Amendments
//      object (validated ledger), read through XRPScan's ledger-object
//      endpoint. This is what activation dates are computed from.
//   2. Vote counts come from a public rippled node's `feature` method.
//   3. XRPScan's amendment list supplies XLS numbers and release versions, and
//      is the fallback for vote counts. It can trail the ledger by hours: on
//      Sept 25, 2026 it still showed a BatchV1_1 majority the ledger had
//      already reset, and it did not list fixBatchV1_2 at all. So it never
//      decides a majority while the ledger read is available.
//
// Amendments need 80% validator support held for two weeks to activate.

const XRPSCAN_LIST_URL = 'https://api.xrpscan.com/api/v1/amendments';
// The Amendments singleton's ledger index is fixed by the protocol.
const AMENDMENTS_OBJECT_URL =
  'https://api.xrpscan.com/api/v1/object/7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4';
// Public rippled JSON-RPC endpoints, tried in order.
const RIPPLED_NODES = ['https://xrplcluster.com/', 'https://s1.ripple.com:51234/'];
const REVALIDATE_S = 900;
const TIMEOUT_MS = 6000;

const RIPPLE_EPOCH_MS = Date.UTC(2000, 0, 1);
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function rippleTimeToDate(seconds) {
  return new Date(RIPPLE_EPOCH_MS + seconds * 1000);
}

function fmtEtDate(d) {
  return d.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
}

function shortHash(id) {
  return `${id.slice(0, 8)}…`;
}

// Never let one failed source take the panel down.
async function safe(fn) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// 1. Ledger Amendments object: majorities (with close times) and enabled set.
async function fetchLedgerAmendments() {
  const res = await fetch(AMENDMENTS_OBJECT_URL, {
    next: { revalidate: REVALIDATE_S },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const j = await res.json();
  if (!j?.validated || !j?.node || j.node.LedgerEntryType !== 'Amendments') return null;
  const majorities = new Map();
  for (const m of j.node.Majorities || []) {
    const a = m?.Majority;
    if (a?.Amendment && typeof a.CloseTime === 'number') {
      majorities.set(a.Amendment.toUpperCase(), rippleTimeToDate(a.CloseTime));
    }
  }
  const enabled = new Set((j.node.Amendments || []).map((s) => String(s).toUpperCase()));
  return { ledgerIndex: j.ledger_index ?? null, majorities, enabled };
}

// 2. rippled `feature`: live vote counts as the node sees them.
async function fetchRippledFeatures() {
  for (const url of RIPPLED_NODES) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'feature', params: [{}] }),
        next: { revalidate: REVALIDATE_S },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const j = await res.json();
      const features = j?.result?.features;
      if (j?.result?.status === 'success' && features && typeof features === 'object') {
        const map = new Map(Object.entries(features).map(([id, f]) => [id.toUpperCase(), f]));
        return { host: new URL(url).hostname, features: map };
      }
    } catch {
      // try the next node
    }
  }
  return null;
}

// 3. XRPScan list: labels, versions, fallback counts.
async function fetchXrpscanList() {
  const res = await fetch(XRPSCAN_LIST_URL, {
    next: { revalidate: REVALIDATE_S },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const all = await res.json();
  if (!Array.isArray(all)) return null;
  return new Map(all.map((a) => [String(a.amendment_id).toUpperCase(), a]));
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export async function fetchVoting() {
  const [ledger, node, list] = await Promise.all([
    safe(fetchLedgerAmendments),
    safe(fetchRippledFeatures),
    safe(fetchXrpscanList),
  ]);
  if (!ledger && !list) return null;

  const isEnabled = (id) =>
    ledger ? ledger.enabled.has(id) : Boolean(node?.features.get(id)?.enabled || list?.get(id)?.enabled);

  // Candidates: anything at majority on the ledger, plus anything either
  // vote source reports as supported, not enabled and not deprecated.
  const ids = new Set(ledger ? ledger.majorities.keys() : []);
  for (const [id, a] of list || []) {
    if (!a.enabled && a.supported && !a.deprecated) ids.add(id);
  }
  for (const [id, f] of node?.features || []) {
    const deprecated = list?.get(id)?.deprecated;
    if (!f?.enabled && f?.supported && !deprecated && isNum(f.count)) ids.add(id);
  }

  let votesFromNode = 0;
  let votesFromList = 0;
  const rows = [];
  for (const id of ids) {
    if (isEnabled(id)) continue;
    const f = node?.features.get(id);
    const a = list?.get(id);

    let count = null;
    let threshold = null;
    let validations = null;
    if (f && isNum(f.count)) {
      ({ count, threshold, validations } = f);
      votesFromNode += 1;
    } else if (a && isNum(a.count)) {
      ({ count, threshold, validations } = a);
      votesFromList += 1;
    }

    // Majority: the ledger decides whenever it was read. XRPScan's list is
    // used only if the ledger read failed outright.
    const majorityAt = ledger
      ? ledger.majorities.get(id) || null
      : a?.majority
        ? rippleTimeToDate(a.majority)
        : null;

    rows.push({
      id,
      name: f?.name || a?.name || shortHash(id),
      xls: a?.xls || null,
      introduced: a?.introduced || null,
      count,
      threshold,
      validations,
      majorityAt,
    });
  }

  rows.sort(
    (x, y) =>
      Number(Boolean(y.majorityAt)) - Number(Boolean(x.majorityAt)) ||
      (y.count ?? -1) - (x.count ?? -1) ||
      x.name.localeCompare(y.name)
  );

  const votesSource = votesFromList === 0 && votesFromNode > 0
    ? `rippled node (${node.host})`
    : votesFromNode === 0
      ? 'XRPScan list, which can trail the ledger'
      : `rippled node (${node.host}), XRPScan list for the rest`;

  return {
    rows,
    ledgerIndex: ledger?.ledgerIndex ?? null,
    majoritySource: ledger ? 'ledger' : 'xrpscan',
    votesSource,
  };
}

export default async function AmendmentsPanel() {
  const data = await fetchVoting();

  if (!data) {
    return (
      <div className="amend" id="amendments">
        <div className="amend-head">
          <span className="amend-title">XRPL amendment voting</span>
        </div>
        <p className="small dim" style={{ margin: 0 }}>Vote data unavailable right now (no source responded). The desk does not estimate missing figures.</p>
      </div>
    );
  }

  const { rows, ledgerIndex, majoritySource, votesSource } = data;
  const majority = rows.filter((r) => r.majorityAt).length;
  const stamp = majoritySource === 'ledger' && ledgerIndex
    ? `ledger ${Number(ledgerIndex).toLocaleString('en-US')}`
    : 'XRPScan list, ledger read unavailable';

  return (
    <div className="amend" id="amendments">
      <div className="amend-head">
        <span className="amend-title">XRPL amendment voting</span>
        <span className="amend-meta">{rows.length} in voting · {majority} at majority · {stamp}</span>
      </div>
      <div className="amend-cols small mute mono" aria-hidden="true">
        <span>Amendment</span><span className="amend-xls">XLS</span><span className="amend-votes">Votes</span><span>Support</span>
      </div>
      {rows.map((r) => {
        const hasVotes = r.count !== null && r.validations;
        const pct = hasVotes ? (r.count / r.validations) * 100 : 0;
        const atMajority = Boolean(r.majorityAt);
        const activation = atMajority ? new Date(r.majorityAt.getTime() + TWO_WEEKS_MS) : null;
        return (
          <div className="amend-row" key={r.id}>
            <span className="amend-name">
              {r.name}
              {r.xls ? <span className="amend-xls-inline small dim mono">{r.xls}</span> : null}
              {atMajority ? <span className="amend-date">majority {fmtEtDate(r.majorityAt)} · earliest activation {fmtEtDate(activation)}</span> : null}
            </span>
            <span className="amend-xls small dim mono">{r.xls || ''}</span>
            <span className="amend-votes small mono">
              {hasVotes ? (
                <>
                  <span style={{ color: atMajority ? 'var(--g)' : 'var(--y)', fontWeight: 600 }}>{r.count}</span>
                  <span className="mute"> / {r.threshold} of {r.validations}</span>
                </>
              ) : (
                <span className="mute">n/a</span>
              )}
            </span>
            <span className="amend-bar-wrap">
              <span className="amend-pct small mono">{hasVotes ? `${pct.toFixed(1)}%` : ''}</span>
              <span className="amend-bar"><span className="amend-fill" style={{ width: `${Math.min(pct, 100)}%`, background: atMajority ? 'var(--g)' : 'var(--y)' }} /></span>
            </span>
          </div>
        );
      })}
      <p className="small mute" style={{ margin: '10px 0 0' }}>
        An amendment activates once it holds 80% validator support for two weeks. Majority dates are read from the ledger&apos;s own Amendments object; vote counts from {votesSource}. Already-enabled amendments are not shown.
      </p>
    </div>
  );
}

// One-line pointer for the Live page: the count that matters plus a link to
// the full panel. Leads with the amendment closest to activation. Renders
// nothing if every source fails, so the Live page never shows a broken line.
export async function AmendmentsStrip() {
  const data = await fetchVoting();
  if (!data || !data.rows.length) return null;
  const atMajority = data.rows
    .filter((r) => r.majorityAt)
    .sort((x, y) => x.majorityAt - y.majorityAt);
  const lead = atMajority[0];
  const activation = lead ? new Date(lead.majorityAt.getTime() + TWO_WEEKS_MS) : null;
  return (
    <p className="amend-strip">
      <span className="amend-strip-label">XRPL amendments</span>
      {data.rows.length} in voting · {atMajority.length} at majority
      {lead ? ` (${lead.name}, earliest activation ${fmtEtDate(activation)})` : ''}
      {' '}<a className="quiet-link" href="/watch#amendments">Live vote table →</a>
    </p>
  );
}
