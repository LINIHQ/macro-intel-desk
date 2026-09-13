// Readout strip: a row of stat tiles, each a small uppercase label over a large
// dot-matrix number over an optional muted sub line. The device is lifted from
// the LINI Ledger ETF tracker headline (XRP HELD, NET ASSETS, LATEST FLOW, FUNDS
// REPORTING).
//
// Every value passed in must be measured data the page already holds. The strip
// formats and displays; it never computes, estimates or defaults a figure. A
// caller that cannot supply a value omits the tile.
//
// Doto is a display face and decimals go faint at small sizes (a Ledger
// finding), so it is applied to the value only, at readout size, never to the
// label or sub line.
export default function ReadoutStrip({ items = [], cols }) {
  if (!items.length) return null;
  return (
    <div className="readout-strip" style={cols ? { '--readout-cols': cols } : undefined}>
      {items.map((it) => (
        <div key={it.label} className="readout-tile">
          <p className="readout-label">{it.label}</p>
          <p
            className={it.hero ? 'readout-value readout-hero' : 'readout-value'}
            style={it.color ? { color: it.color } : undefined}
          >
            {it.value}
          </p>
          {it.sub ? <p className="readout-sub">{it.sub}</p> : null}
        </div>
      ))}
    </div>
  );
}
