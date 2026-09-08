'use client';

import { useState } from 'react';
import { LEVEL_COLORS } from '@/lib/format';

// Classification history for a dashboard gauge.
//
// Oldest on the left, newest on the right, over the same window and the same
// vertical scale for all eight tiles so they can be read against each other.
// Vertical meaning is fixed and explicit: HIGHER MEANS MORE ADVERSE.
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
// The four levels are spread across the full height rather than scaled as a
// fraction of it, so adjacent levels are as far apart as the box allows. Level 4
// sits at the top, level 1 at the bottom, both inset so neither can be mistaken
// for a border.
//
// No smoothing, no interpolation, no jitter, no decorative variation. A step
// exists only where briefs actually recorded a level, and a brief with no recorded
// level breaks the run and is drawn as a gap rather than bridged. Where the
// classification never changed, the strip is one flat line, and that flatness is
// the finding.
//
// Separate from the trend arrow by design. The arrow describes movement toward a
// published trigger that has not fired. This shows classifications already
// recorded. The two answer different questions and are never merged.
//
// dashboard_states rows are written once per run and are not edited afterwards, so
// this is the sequence as it was published at the time. Corrections are additive
// and appear in the brief, never by backdating a step here.

const LEVEL_WORD = { 1: 'green', 2: 'yellow', 3: 'orange', 4: 'red' };

function fmtShort(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}

// Levels map to evenly spaced tracks inside a padded box: 4 at the top, 1 at the
// bottom. Using the full height means one level of change is the largest vertical
// move the strip can show, which is the whole point of the strip.
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

// Stepped line with vertical risers between spans. The current span is drawn
// heavier so the eye lands on where the gauge is now; earlier spans sit back a
// little without losing legibility. Strokes are pinned with non-scaling-stroke
// because the SVG stretches horizontally and an unpinned stroke would smear.
function Steps({ spans, series, w, h, pad, weight, dim = null }) {
  return spans.map((s, k) => {
    const x0 = (s.start * w) / series.length;
    const x1 = ((s.end + 1) * w) / series.length;
    const y = yFor(s.level, h, pad);
    const c = LEVEL_COLORS[s.level];
    const prev = spans[k - 1];
    const riser = prev && prev.end === s.start - 1 ? yFor(prev.level, h, pad) : null;
    const isLast = k === spans.length - 1;
    const faded = dim != null && !(dim >= s.start && dim <= s.end);
    const sw = isLast ? weight + 0.9 : weight;
    return (
      <g key={k} opacity={faded ? 0.3 : isLast ? 1 : 0.78}>
        {riser != null ? (
          <line
            x1={x0}
            x2={x0}
            y1={riser}
            y2={y}
            stroke={c}
            strokeWidth={sw}
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
          strokeWidth={sw}
          strokeLinecap="butt"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  });
}

// Compact strip on its own row inside a tile, full tile width. The bottom margin
// reserves space for the tile's expand chevron, which is absolutely positioned at
// the bottom right and used to sit on top of the line.
export function HistoryStrip({ series = [], catLabel = 'Gauge' }) {
  const w = 100;
  const h = 24;
  const pad = 3;
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
      style={{ display: 'block', width: '100%', height: 24, marginTop: 10, marginBottom: 12 }}
    >
      <Steps spans={spans} series={series} w={w} h={h} pad={pad} weight={1.7} />
    </svg>
  );
}

// Full-width version for the expanded tile panel. Same step line, plus labelled
// level tracks and invisible per-brief hit targets, so hover and tap still resolve
// to a single brief's date and status even though the visual is merged.
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
  const h = 58;
  const pad = 6;
  const n = series.length;
  const slot = w / n;
  const spans = toSpans(series);
  const shown = sel != null ? series[sel] : null;
  const current = pts[pts.length - 1];

  return (
    <div style={{ margin: '14px 0 0' }}>
      <div
        className="small mute"
        style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}
      >
        <span style={{ letterSpacing: '0.04em' }}>CLASSIFICATION HISTORY</span>
        <span>higher means more adverse</span>
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
        {[1, 2, 3, 4].map((lv) => (
          <line
            key={lv}
            x1="0"
            x2={w}
            y1={yFor(lv, h, pad)}
            y2={yFor(lv, h, pad)}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
            opacity="0.14"
          />
        ))}
        <Steps spans={spans} series={series} w={w} h={h} pad={pad} weight={2} dim={sel} />
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
        on the same window for every gauge. Width is how long that classification held. A single flat
        line means it never changed. Steps show what was published at the time and are never
        backdated; corrections appear in the brief instead. This is separate from the trend arrow,
        which describes movement toward a trigger that has not fired.
      </p>
    </div>
  );
}

export default HistoryStrip;
