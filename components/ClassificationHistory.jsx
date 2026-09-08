'use client';

import { useState } from 'react';
import { LEVEL_COLORS } from '@/lib/format';

// Classification history for a dashboard gauge.
//
// Oldest on the left, newest on the right, over the same window and the same
// vertical scale for all eight tiles so they can be read against each other.
// Vertical meaning is fixed and explicit: HIGHER MEANS MORE ADVERSE.
//
// Drawn as a step chart of RUNS, not of individual briefs. Consecutive briefs
// carrying the same classification merge into one segment whose width is how long
// that classification held. The first version drew one bar per brief with a gap
// between each, which at two dozen briefs in sixty pixels produced a barcode: two
// dozen near-identical bars competing with the tile's own value text while saying
// one thing. Merging shows the actual shape (held, stepped, held) in three or four
// segments instead of twenty-four, and no information is lost because the merged
// runs were identical by definition. Per-brief resolution stays available on the
// expanded panel, where there is room for it.
//
// There is no smoothing, no interpolation, no jitter and no decorative variation.
// A segment exists only where briefs actually recorded a level for that category,
// and a brief with no recorded level breaks the run and is drawn as a gap rather
// than bridged. Where the classification did not change, the strip is one flat
// bar, and that flatness is the finding.
//
// Separate from the trend arrow by design. The arrow describes movement toward a
// published trigger that has not fired. This shows classifications already
// recorded. The two answer different questions and are never merged.
//
// dashboard_states rows are written once per run and are not edited afterwards, so
// this is the sequence as it was published at the time. Corrections are additive
// and appear in the brief, never by backdating a segment here.

const LEVEL_WORD = { 1: 'green', 2: 'yellow', 3: 'orange', 4: 'red' };

function fmtShort(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
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

// Shared step geometry: a translucent fill under each span plus a solid top edge,
// with vertical risers connecting adjacent spans so the shape reads as a staircase
// rather than as free-floating blocks. Strokes use non-scaling-stroke because the
// SVG is stretched horizontally, and an unpinned stroke would smear with it.
function Steps({ spans, series, w, h, dim = null }) {
  return spans.map((s, k) => {
    const x0 = (s.start * w) / series.length;
    const x1 = ((s.end + 1) * w) / series.length;
    const y = h - (s.level / 4) * h;
    const c = LEVEL_COLORS[s.level];
    const prev = spans[k - 1];
    const riser = prev && prev.end === s.start - 1 ? h - (prev.level / 4) * h : null;
    const faded = dim != null && !(dim >= s.start && dim <= s.end);
    return (
      <g key={k} opacity={faded ? 0.35 : 1}>
        <rect x={x0} y={y} width={x1 - x0} height={h - y} fill={c} opacity="0.28" />
        <line
          x1={x0}
          x2={x1}
          y1={y}
          y2={y}
          stroke={c}
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
        />
        {riser != null ? (
          <line
            x1={x0}
            x2={x0}
            y1={riser}
            y2={y}
            stroke={c}
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </g>
    );
  });
}

// Compact strip drawn on its own row inside a tile, full tile width so it never
// competes with the value for horizontal space.
export function HistoryStrip({ series = [], catLabel = 'Gauge' }) {
  const w = 100;
  const h = 20;
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
      style={{ display: 'block', width: '100%', height: 20, marginTop: 9 }}
    >
      <Steps spans={spans} series={series} w={w} h={h} />
    </svg>
  );
}

// Full-width version for the expanded tile panel. Same step shape, plus level
// gridlines and invisible per-brief hit targets so hover and tap still resolve to
// a single brief's date and status even though the visual is merged.
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
  const h = 54;
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
            y1={h - (lv / 4) * h}
            y2={h - (lv / 4) * h}
            stroke="currentColor"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            opacity="0.12"
          />
        ))}
        <Steps spans={spans} series={series} w={w} h={h} dim={sel} />
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
        step means it never changed. Steps show what was published at the time and are never
        backdated; corrections appear in the brief instead. This is separate from the trend arrow,
        which describes movement toward a trigger that has not fired.
      </p>
    </div>
  );
}

export default HistoryStrip;
