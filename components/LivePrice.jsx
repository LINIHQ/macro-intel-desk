// Live XRP spot price, sitting beside the Fear & Greed gauge in the page header.
//
// This is deliberately NOT the same thing as the brief's own "XRP spot: $1.37"
// stamp inside Where things stand. That figure is frozen at write time, sourced,
// and timestamped per Operating Rule 11, because the brief's gauges and math
// were built from it and it has to stay auditable after the fact. This widget
// is ambient market context for right now, the same role the Fear & Greed dial
// already plays, and it follows the same rules: fetched server-side, cached with
// a short revalidate window so the outbound call happens once per window
// regardless of traffic, and it renders nothing rather than a wrong or stale
// number if every source fails. Live page only, never a brief permalink: an
// archived brief is a record of that day, and today's live price has no business
// sitting on it (same reason CrowdGauge never appears on /brief/[id]).
//
// Two decimals, matching how the frozen stamp is written elsewhere on the site,
// so the two numbers read as directly comparable rather than differing only in
// precision.

async function fromCmc() {
  const key = process.env.CMC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=XRP',
      {
        headers: { 'X-CMC_PRO_API_KEY': key },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const row = json?.data?.XRP?.[0]?.quote?.USD;
    const price = Number(row?.price);
    if (!Number.isFinite(price)) return null;
    const change = Number(row?.percent_change_24h);
    return { price, change: Number.isFinite(change) ? change : null };
  } catch {
    return null;
  }
}

async function fromCoinGecko() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const price = Number(json?.ripple?.usd);
    if (!Number.isFinite(price)) return null;
    const change = Number(json?.ripple?.usd_24h_change);
    return { price, change: Number.isFinite(change) ? change : null };
  } catch {
    return null;
  }
}

function fmtPrice(v) {
  return `$${v.toFixed(2)}`;
}

export default async function LivePrice() {
  const reading = (await fromCmc()) || (await fromCoinGecko());
  if (!reading) return null;

  const { price, change } = reading;
  const changeColor = change == null ? undefined : change >= 0 ? 'var(--g)' : 'var(--r)';
  const changeSign = change != null && change >= 0 ? '+' : '';

  return (
    <div className="live-price">
      <div className="live-price-label">
        <span className="live-dot" aria-hidden="true" />
        XRP Live Price
      </div>
      <div className="live-price-row">
        <span className="live-price-num">{fmtPrice(price)}</span>
        {change != null ? (
          <span className="live-price-chg" style={{ color: changeColor }}>
            {changeSign}
            {change.toFixed(2)}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
