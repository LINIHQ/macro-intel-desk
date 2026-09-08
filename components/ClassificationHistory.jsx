'use client';

import { useState } from 'react';
import { LEVEL_COLORS } from '@/lib/format';

// Classification history for a dashboard gauge.
//
// Every segment is one published run's recorded classification for that category,
// oldest on the left, newest on the right, over the same window for all eight
// tiles so they can be read against each other. Vertical meaning is fixed and
// explicit: HIGHER MEANS MORE ADVERSE (level 4 red is a full-height bar, level 1
// green is a quarter-height bar).
//
// There is no smoothing, no interpolation, no jitter and no decorative variation.
// A segment exists only where a run actually recorded a level for that category,
// and a run with no recorded level is drawn as a gap rather than filled in. Where
// the classification did not change, the strip is flat, and that flatness is the
// finding.
//
// This is deliberately separate from the trend arrow. The arrow describes movement
// toward a published trigger that has not fired yet. This strip shows only
// classifications already recorded and published. The two answer different
// questions and are never merged.
//
// dashboard_states rows are written once per run and are not edited afterwards, so
// this strip is the sequence as it was published at the time. Corrections are
// additive and appear in the brief, never by backdating a segment here.

const LEVEL_WORD = { 1: 'green', 2: 'yellow', 3: 'orange', 4: 'red' };

function fmtShort(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}

// Index of the most recent segment whose level differs from the level that
// followed it, i.e. the last time this classification actually moved.
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
      ? `unchanged across all ${pts.length} recorded runs`
      : `${changes} change${changes === 1 ? '' : 's'} across ${pts.length} recorded runs, most recently ${fmtShort(pts[ci].date)}`;
  return `${catLabel} classification history, oldest to newest. Higher means more adverse. Currently ${now.label || LEVEL_WORD[now.level]}, ${tail}.`;
}

// Compact strip drawn inside a tile. Same window and same vertical scale on every
// tile. The newest segment is drawn at full strength and prior segments are held
// back, so the current reading is legible without changing what any segment means.
//
// preserveAspectRatio is "none" because the mobile rule in globals.css stretches
// .hist-strip to fill the tile width at a fixed height. Letting it letterbox
// instead would shrink the bars into a band in the middle of the tile. Stretching
// rectangles changes their width, never their height, so the one thing a segment
// encodes (its level) survives the scaling untouched.
export function HistoryStrip({ series = [], catLabel = 'Gauge' }) {
  const w = 60;
  const h = 24;
  const n = series.length;
  if (!n) return <div className="hist-strip" aria-hidden="true" />;

  const slot = w / n;
  const gap = slot > 3.2 ? Math.min(1, slot * 0.2) : 0;
  const bw = Math.max(0.9, slot - gap);

  return (
    <svg
      className="hist-strip"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={summarize(series, catLabel)}
    >
      {series.map((p, i) =>
        p ? (
          <rect
            key={i}
            x={(i * slot).toFixed(2)}
            y={(h - (p.level / 4) * h).toFixed(2)}
            width={bw.toFixed(2)}
            height={((p.level / 4) * h).toFixed(2)}
            fill={LEVEL_COLORS[p.level]}
            opacity={i === n - 1 ? 1 : 0.5}
          />
        ) : null
      )}
    </svg>
  );
}

// Full-width version for the expanded tile panel, where there is room to label it
// and to put a date and a status name behind every segment on hover or tap.
export function HistoryDetail({ series = [], catLabel = 'Gauge' }) {
  const [sel, setSel] = useState(null);
  const pts = series.filter(Boolean);

  if (!pts.length) {
    return (
      <p className="small mute" style={{ margin: '10px 0 0' }}>
        Classification history: no runs have recorded a level for this gauge yet.
      </p>
    );
  }

  const w = 320;
  const h = 54;
  const n = series.length;
  const slot = w / n;
  const gap = slot > 4 ? Math.min(1.6, slot * 0.2) : 0;
  const bw = Math.max(1.2, slot - gap);
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
            y1={(h - (lv / 4) * h).toFixed(2)}
            y2={(h - (lv / 4) * h).toFixed(2)}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.12"
          />
        ))}
        {series.map((p, i) =>
          p ? (
            <rect
              key={i}
              x={(i * slot).toFixed(2)}
              y={(h - (p.level / 4) * h).toFixed(2)}
              width={bw.toFixed(2)}
              height={((p.level / 4) * h).toFixed(2)}
              fill={LEVEL_COLORS[p.level]}
              opacity={sel == null || sel === i ? 1 : 0.4}
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
              <span className="hint-pointer">Hover</span> a segment for its date and status
            </span>
          )}
        </span>
        <span className="mute">{fmtShort(current.date)}</span>
      </div>

      <p className="small mute" style={{ margin: '8px 0 0' }}>
        One segment per published run, oldest to newest, on the same window for every gauge. A flat
        strip means the classification did not change. Segments show what was published at the time
        and are never backdated; corrections appear in the brief instead. This is separate from the
        trend arrow, which describes movement toward a trigger that has not fired.
      </p>
    </div>
  );
}

export default HistoryStrip;
