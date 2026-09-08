'use client';

import { useState } from 'react';
import { LEVEL_COLORS } from '@/lib/format';

// Classification history for a dashboard gauge.
//
// Oldest on the left, newest on the right, over the same window and the same
// fixed 1 to 4 scale for all eight gauges, so the strips can be read against each
// other. Vertical meaning is fixed and explicit: HIGHER MEANS MORE ADVERSE. There
// is no per-gauge auto-scaling; a gauge that never leaves level 3 draws a flat
// line at level 3, not a line rescaled to fill its own box.
//
// Drawn as a step LINE over RUNS. Two decisions worth keeping:
//
// 1. Runs, not briefs. Consecutive briefs carrying the same classification merge
//    into one step whose width is how long that classification held. Drawing one
//    bar per brief put two dozen near-identical bars in sixty pixels and produced
//    a barcode: visually loud, informationally empty, and competing with the
//    tile's own value text. Nothing is lost by merging, because the bars that
//    merged were identical by definition. Per-brief resolution stays on the
//    expanded panel, where there is room for it.
//
// 2. Line, no area fill. Filling from the level down to the baseline encodes the
//    level twice, once as position and once as mass, and mass wins: a gauge at red
//    became a solid block with no readable shape, and the strip read as a progress
//    bar rather than a chart. The line alone carries the same information and lets
//    the steps be the thing the eye finds.
//
// No smoothing, no interpolation, no jitter, no gridlines, no decorative
// variation. A step exists only where briefs actually recorded a level, and a
// brief with no recorded level breaks the run and is drawn as a gap rather than
// bridged. Where the classification never changed, the strip is one flat line, and
// that flatness is the finding.
//
// Separate from the trend arrow by design. The arrow describes movement toward a
// published trigger that has not fired. This shows classifications already
// recorded. The two answer different questions and are never merged.
//
// dashboard_states rows are written once per run and are not edited afterwards, so
// this is the sequence as it was published at the time. Corrections are additive
// and appear in the brief, never by backdating a step here.

const LEVEL_WORD = { 1: 'green', 2: 'yellow', 3: 'orange', 4: 'red' };

export const HISTORY_CAPTION = 'Classification history · oldest → newest · higher = more adverse';

function fmtShort(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}

// Levels map to evenly spaced tracks inside a padded box: 4 at the top, 1 at the
// bottom. Shared by every gauge, so one level of change is the same vertical
// distance everywhere and two strips can be compared by eye.
function yFor(level, h, pad) {
  return pad + ((4 - level) * (h - 2 * pad)) / 3;
}

// Collapse the run-aligned series into contiguous same-level spans. A null entry
// (a brief that recorded no level for this category) ends the current span and is
// never bridged over, so a gap in the record stays visible as a gap.
function toSpans(series) {
  const spans = [];
  let cur = null;
  series.forEach((p, i) => {
    if (!p) {
      cur = null;
      return;
    }
    if (cur && cur.level === p.level && cur.end === i - 1) {
      cur.end = i;
      cur.to = p.date;
      return;
    }
    cur = { level: p.level, label: p.label, start: i, end: i, from: p.date, to: p.date };
    spans.push(cur);
  });
  return spans;
}

function lastChangeIndex(series) {
  const pts = series.filter(Boolean);
  for (let i = pts.length - 1; i > 0; i--) {
    if (pts[i].level !== pts[i - 1].level) return i;
  }
  return -1;
}

function summarize(series, catLabel) {
  const pts = series.filter(Boolean);
  if (!pts.length) return `${catLabel}: no classification history recorded yet.`;
  const now = pts[pts.length - 1];
  const ci = lastChangeIndex(series);
  const changes = pts.reduce((n, p, i) => (i > 0 && p.level !== pts[i - 1].level ? n + 1 : n), 0);
  const tail =
    ci === -1
      ? `unchanged across all ${pts.length} recorded briefs`
      : `${changes} change${changes === 1 ? '' : 's'} across ${pts.length} recorded briefs, most recently ${fmtShort(pts[ci].date)}`;
  return `${catLabel} classification history, oldest to newest. Higher means more adverse. Currently ${now.label || LEVEL_WORD[now.level]}, ${tail}.`;
}

// Stepped line with vertical risers between spans, plus an endpoint dot at the
// newest observation in the current status colour.
//
// Every stroke is pinned with non-scaling-stroke: the SVG is stretched
// horizontally to fill its tile, and an unpinned stroke would smear with it.
// That pinning is also what makes the endpoint dot work. A <circle> would render
// as an ellipse under the same horizontal stretch, but a zero-length line with a
// round cap and a pinned stroke draws a true circle in screen pixels at any scale,
// so the dot stays round on every tile width and every device.
//
// Historical steps sit slightly back from the current one. They stay clearly
// readable: the point is emphasis on where the gauge is now, not hiding where it
// has been.
function Steps({ spans, series, xw, h, pad, weight, dim = null }) {
  const n = series.length;
  return spans.map((s, k) => {
    const x0 = (s.start * xw) / n;
    const x1 = ((s.end + 1) * xw) / n;
    const y = yFor(s.level, h, pad);
    const c = LEVEL_COLORS[s.level];
    const prev = spans[k - 1];
    const riser = prev && prev.end === s.start - 1 ? yFor(prev.level, h, pad) : null;
    const isLast = k === spans.length - 1;
    const faded = dim != null && !(dim >= s.start && dim <= s.end);
    return (
      <g key={k} opacity={faded ? 0.3 : isLast ? 1 : 0.72}>
        {riser != null ? (
          <line
            x1={x0}
            x2={x0}
            y1={riser}
            y2={y}
            stroke={c}
            strokeWidth={weight}
            strokeLinecap="butt"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <line
          x1={x0}
          x2={x1}
          y1={y}
          y2={y}
          stroke={c}
          strokeWidth={weight}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
        />
        {isLast ? (
          <line
            x1={x1}
            x2={x1 + 0.001}
            y1={y}
            y2={y}
            stroke={c}
            strokeWidth={weight + 3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </g>
    );
  });
}

// Compact strip on its own row inside a tile, full tile width. The bottom margin
// reserves space for the tile's expand chevron, which is absolutely positioned at
// the bottom right and would otherwise sit on top of the line.
//
// maxWidth is set explicitly because globals.css still carries an earlier
// .hist-strip rule with max-width: 130px from the mobile breakpoint. An inline
// width does not override a stylesheet max-width, so without this the strip is
// silently clamped to 130px at every screen size. When those stale rules come out
// of globals.css this line goes with them.
export function HistoryStrip({ series = [], catLabel = 'Gauge' }) {
  const w = 100;
  const h = 28;
  const pad = 3;
  // Drawing stops short of the viewBox edge so the endpoint dot is not clipped by
  // the SVG's own bounds.
  const xw = w - 4;
  if (!series.length) return null;
  const spans = toSpans(series);
  if (!spans.length) return null;

  return (
    <svg
      className="hist-strip"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={summarize(series, catLabel)}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: 'none',
        height: 28,
        marginTop: 9,
        marginBottom: 11,
      }}
    >
      <Steps spans={spans} series={series} xw={xw} h={h} pad={pad} weight={2} />
    </svg>
  );
}

// Full-width version for the expanded tile panel. Same step line on the same fixed
// scale, with invisible per-brief hit targets so hover and tap still resolve to a
// single brief's date and status even though the visual is merged.
export function HistoryDetail({ series = [], catLabel = 'Gauge' }) {
  const [sel, setSel] = useState(null);
  const pts = series.filter(Boolean);

  if (!pts.length) {
    return (
      <p className="small mute" style={{ margin: '10px 0 0' }}>
        Classification history: no briefs have recorded a level for this gauge yet.
      </p>
    );
  }

  const w = 320;
  const h = 62;
  const pad = 7;
  const xw = w - 5;
  const n = series.length;
  const slot = xw / n;
  const spans = toSpans(series);
  const shown = sel != null ? series[sel] : null;
  const current = pts[pts.length - 1];

  return (
    <div style={{ margin: '14px 0 0' }}>
      <div className="small mute" style={{ letterSpacing: '0.04em', marginBottom: 5 }}>
        CLASSIFICATION HISTORY
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="none"
        role="img"
        aria-label={summarize(series, catLabel)}
        style={{ display: 'block', touchAction: 'manipulation' }}
        onMouseLeave={() => setSel(null)}
      >
        <Steps spans={spans} series={series} xw={xw} h={h} pad={pad} weight={2} dim={sel} />
        {series.map((p, i) =>
          p ? (
            <rect
              key={`hit-${i}`}
              x={i * slot}
              y="0"
              width={slot}
              height={h}
              fill="transparent"
              onMouseEnter={() => setSel(i)}
              onClick={() => setSel(sel === i ? null : i)}
              style={{ cursor: 'pointer' }}
            />
          ) : null
        )}
      </svg>

      <div
        className="small"
        style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 6 }}
      >
        <span className="mute">{fmtShort(pts[0].date)}</span>
        <span style={{ textAlign: 'center', minHeight: '1.2em' }}>
          {shown ? (
            <>
              {fmtShort(shown.date)} · {shown.label || LEVEL_WORD[shown.level]}
            </>
          ) : (
            <span className="mute">
              <span className="hint-touch">Tap</span>
              <span className="hint-pointer">Hover</span> for a brief's date and status
            </span>
          )}
        </span>
        <span className="mute">{fmtShort(current.date)}</span>
      </div>

      <p className="small mute" style={{ margin: '8px 0 0' }}>
        Each step is a run of consecutive briefs carrying the same classification, oldest to newest,
        on the same window and the same scale as every other gauge. Width is how long that
        classification held, and the dot marks the newest observation. A single flat line means it
        never changed. Steps show what was published at the time and are never backdated;
        corrections appear in the brief instead. This is separate from the trend arrow, which
        describes movement toward a trigger that has not fired.
      </p>
    </div>
  );
}

export default HistoryStrip;
