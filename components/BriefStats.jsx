import ReadoutStrip from './ReadoutStrip';

// Hero strip for a brief page: four readouts drawn from the brief the page has
// already fetched. Sits between the page header and the gauge grid.
//
// The cells deliberately do not repeat the evidence-through or published stamps,
// which already sit in the page header two lines up; each surface has one job.
//
// XRP spot is read from the stamp the run wrote into dashboard_md under
// Operating Rule 11, which every run opens with in one shape:
//   **XRP spot: $1.37**, CoinMarketCap, Saturday Sept 12, about 9:45 am ET; ...
// The price is the first dollar figure after "XRP spot:", and the source is the
// clause that follows it. If the stamp is absent the tile is omitted; the page
// never shows a price the run did not record. A dedicated numeric column is the
// hardening step if this parse ever proves brittle.
export function parseSpot(md) {
  if (!md) return null;
  const withSource = md.match(/XRP spot:\s*\$([0-9]+(?:\.[0-9]+)?)\**\s*,\s*([^,.;\n]+)/i);
  if (withSource) return { price: withSource[1], source: withSource[2].trim() };
  const priceOnly = md.match(/XRP spot:\s*\$([0-9]+(?:\.[0-9]+)?)/i);
  return priceOnly ? { price: priceOnly[1], source: null } : null;
}

export default function BriefStats({ brief }) {
  if (!brief) return null;

  const states = brief.dashboard_states || [];
  const items = brief.brief_items || [];

  const spot = parseSpot(brief.dashboard_md);
  const changed = states.filter((s) => s.changed_from_prior === true).length;
  const worsening = states.filter((s) => s.trend === 'worsening').length;
  const improving = states.filter((s) => s.trend === 'improving').length;
  const arrows = worsening + improving;
  const critical = items.filter((i) => i.importance === 'critical').length;
  const high = items.filter((i) => i.importance === 'high').length;

  const cells = [];

  if (spot) {
    cells.push({
      label: 'XRP spot',
      value: `$${spot.price}`,
      sub: spot.source ? `${spot.source}, at write time` : 'at write time',
      color: 'var(--acc)',
      hero: true,
    });
  }

  if (states.length) {
    cells.push({
      label: 'Gauges changed',
      value: String(changed),
      sub: changed === 0 ? `all ${states.length} hold` : `of ${states.length} this brief`,
    });
  }

  if (items.length) {
    cells.push({
      label: 'Ranked items',
      value: String(items.length),
      sub: `${critical} critical · ${high} high`,
    });
  }

  if (states.length) {
    cells.push({
      label: 'Trend arrows',
      value: String(arrows),
      sub:
        arrows === 0
          ? 'no criterion partially met'
          : `${worsening} worsening · ${improving} improving`,
      color: worsening > 0 ? 'var(--r)' : improving > 0 ? 'var(--g)' : undefined,
    });
  }

  if (!cells.length) return null;

  return (
    <div style={{ margin: '0 0 18px' }}>
      <ReadoutStrip items={cells} />
    </div>
  );
}
