import ReadoutStrip from './ReadoutStrip';

// Hero strip for a brief page: readouts drawn from the brief the page has
// already fetched. Sits between the page header and the gauge grid.
//
// The cells deliberately do not repeat the evidence-through or published stamps,
// which already sit in the page header two lines up; each surface has one job.
//
// Sept 13, 2026: XRP spot moved out of this strip. It now lives in two places
// on purpose, not one: components/LivePrice.jsx shows the live market price up
// in the page header next to Fear & Greed, and the brief's own frozen "XRP
// spot: $1.37, at write time" stamp stays where Operating Rule 11 puts it,
// inside the dashboard_md prose under Where things stand. A third copy of the
// same number here, styled as a big hero figure, read as a duplicate of one or
// the other depending on whether it matched the live price or the frozen one,
// which is exactly the confusion neither of those two is supposed to create.
export default function BriefStats({ brief }) {
  if (!brief) return null;

  const states = brief.dashboard_states || [];
  const items = brief.brief_items || [];

  const changed = states.filter((s) => s.changed_from_prior === true).length;
  const worsening = states.filter((s) => s.trend === 'worsening').length;
  const improving = states.filter((s) => s.trend === 'improving').length;
  const arrows = worsening + improving;
  const critical = items.filter((i) => i.importance === 'critical').length;
  const high = items.filter((i) => i.importance === 'high').length;

  const cells = [];

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
      <ReadoutStrip items={cells} cols={3} />
    </div>
  );
}
