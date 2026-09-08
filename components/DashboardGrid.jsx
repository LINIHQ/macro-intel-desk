'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';
import { CATEGORY_ICONS } from '@/components/Icons';
import { HistoryStrip, HistoryDetail, HISTORY_CAPTION } from '@/components/ClassificationHistory';

// Level meanings mirror the rubric published on the Sources page. Keep the two in sync.
// This is the generic definition of a level. It is the fallback, never the answer:
// where a run recorded basis_md, the tile leads with the specific observation instead.
const LEVEL_MEANINGS = {
  1: 'Baseline. Conditions normal or supportive; nothing demanding attention.',
  2: 'Watch. Early signals worth tracking, not yet confirmed by hard evidence.',
  3: 'Elevated. Verified evidence of active stress or deterioration; this variable is moving.',
  4: 'Regime-level. Disruption or stress severe enough to change the macro picture, declared only on confirmed events.',
};

function fmtChecked(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

// Small down-chevron: signals a tile is expandable. Rotates to point up when open.
function TileChevron() {
  return (
    <svg className="tile-chevron" width="10" height="10" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Criterion-gated trend arrow: rendered only when a run wrote a trend to the database,
// which happens only when a pre-registered movement criterion is partially met or a
// tracked level is converging on a trigger. Direction refers to the criterion, not price.
// Kept strictly separate from the classification history strip: the arrow is about a
// trigger that has not fired, the strip is about classifications already recorded.
function TrendArrow({ trend }) {
  const up = trend === 'improving';
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      {up ? (
        <path d="M1 12 L6 7 L9 10 L14 5 M9.5 4.5 H14.5 V9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <path d="M1 4 L6 9 L9 6 L14 11 M9.5 11.5 H14.5 V6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </svg>
  );
}

export default function DashboardGrid({ states, history, criteria = {}, verifiedThrough = null }) {
  const [openKey, setOpenKey] = useState(null);
  const rootRef = useRef(null);
  const detailRef = useRef(null);

  const byCategory = history?.byCategory ?? {};
  const hasHistory = CATEGORIES.some((c) => (byCategory[c.key] ?? []).some(Boolean));

  // Clicking anywhere outside the grid or panel, or pressing Escape, closes the panel.
  useEffect(() => {
    if (!openKey) return;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenKey(null);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpenKey(null);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openKey]);

  // The detail panel renders once, below the full tile grid. On a phone screen that
  // means opening any tile above the last row can put the panel off-screen with no
  // indication it appeared. Scroll it into view on open, minimal distance only
  // ('nearest' is a no-op if the panel is already fully visible), and skip the
  // animation for anyone with reduced-motion set.
  useEffect(() => {
    if (!openKey) return;
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'nearest',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [openKey]);

  const openCat = openKey ? CATEGORIES.find((c) => c.key === openKey) : null;
  const openState = openKey ? stateFor(states, openKey) : null;
  const openColor = openState ? LEVEL_COLORS[openState.level] : 'var(--mute)';
  const openCrit = openKey ? criteria[openKey] : null;
  const checked = fmtChecked(verifiedThrough);

  return (
    <div ref={rootRef}>
      <div className="dash-grid">
        {CATEGORIES.map((c) => {
          const s = stateFor(states, c.key);
          const color = s ? LEVEL_COLORS[s.level] : 'var(--mute)';
          const isOpen = openKey === c.key;
          // The tile that moved this run carries the persistent glow; everything else
          // sits at normal weight. A grid with no glow means nothing changed.
          const tileClass = ['tile', isOpen ? 'open' : '', s?.changed_from_prior ? 'changed' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={c.key}
              type="button"
              className={tileClass}
              style={{ '--tile-c': color }}
              onClick={() => {
                if (!s) return;
                setOpenKey(isOpen ? null : c.key);
              }}
              aria-expanded={isOpen}
            >
              <div className="tile-top">
                <span className="tile-icon">{CATEGORY_ICONS[c.key]}</span>
                <span className="tile-cat">{c.label}</span>
              </div>
              {/* The value gets the full tile width. The history strip used to share
                  this row, which cost the value roughly a third of its space and
                  truncated the longer classifications ("UNFAVORAB..."). The strip is
                  now its own full-width row underneath, where a wide, short shape
                  reads better anyway. display:block is set inline because .tile-mid
                  is still flex in globals.css for the desktop breakpoint. */}
              <div className="tile-mid" style={{ display: 'block' }}>
                <div className="tile-val">{s ? s.label : '--'}</div>
              </div>
              <HistoryStrip series={byCategory[c.key] ?? []} catLabel={c.label} />
              {s?.trend ? (
                <div className={`tile-trend ${s.trend === 'improving' ? 'tile-trend-up' : 'tile-trend-down'}`}>
                  <TrendArrow trend={s.trend} />
                  <span>{s.trend}</span>
                </div>
              ) : null}
              {s?.changed_from_prior ? <div className="tile-badge">changed</div> : null}
              {s ? <TileChevron /> : null}
            </button>
          );
        })}
      </div>

      {/* One caption for all eight strips rather than a legend per tile. The strips
          share a window and a scale, so the explanation is shared too, and repeating
          it eight times would cost more space than the strips themselves. */}
      {hasHistory ? (
        <p className="small mute" style={{ margin: '10px 0 0', letterSpacing: '0.02em' }}>
          {HISTORY_CAPTION}
        </p>
      ) : null}

      {openCat && openState ? (
        <div ref={detailRef} className="tile-detail" style={{ '--tile-c': openColor }}>
          <div className="tile-detail-head">
            <span className="tile-detail-cat">{openCat.label}</span>
            <span className="tile-detail-val">{openState.label}</span>
            {openState.trend ? (
              <span className={`tile-detail-trend ${openState.trend === 'improving' ? 'tile-trend-up' : 'tile-trend-down'}`}>
                <TrendArrow trend={openState.trend} /> {openState.trend}
              </span>
            ) : null}
          </div>

          {/* 1. Why this status, and what observation supports it. basis_md carries the
              specific reading behind the level and is written on every gauge every run,
              holds included. The generic level rubric is the fallback when a run has not
              recorded one yet, and it is labelled as generic so it cannot be mistaken for
              evidence. */}
          {openState.basis_md ? (
            <p>
              <strong>Why this level:</strong> {openState.basis_md}
            </p>
          ) : (
            <p>
              <strong>Level definition, generic:</strong> {LEVEL_MEANINGS[openState.level]} No
              gauge-specific basis was recorded for this run.
            </p>
          )}

          {openState.changed_from_prior ? (
            <p>
              <strong>Changed in this brief{openState.change_reason ? ':' : '.'}</strong>
              {openState.change_reason ? ` ${openState.change_reason}` : ''}
            </p>
          ) : null}

          {openState.trend && openState.trend_note ? (
            <p>
              <strong>Trend, criterion-gated:</strong> {openState.trend_note} An arrow appears only when a pre-registered movement criterion is partially met or a tracked level is converging on a trigger; the classification itself moves only when the criterion fires.
            </p>
          ) : null}

          {/* 2. What would change it. Read from the public criterion register, so the tile
              cannot state a test the register has already superseded. */}
          {openCrit?.worsen || openCrit?.improve ? (
            <div style={{ margin: '4px 0 0' }}>
              <p style={{ marginBottom: 4 }}>
                <strong>What would change it, pre-registered:</strong>
              </p>
              <ul style={{ margin: '0 0 6px', paddingLeft: '1.1em' }}>
                {openCrit.worsen ? (
                  <li>
                    <strong>Worsens:</strong> {openCrit.worsen.text}
                  </li>
                ) : null}
                {openCrit.improve ? (
                  <li>
                    <strong>Improves:</strong> {openCrit.improve.text}
                  </li>
                ) : null}
              </ul>
              <p className="small mute" style={{ margin: 0 }}>
                Every revision to these tests, with its old wording, effective date and reason, is on
                the <Link href="/methodology">criterion register</Link>.
              </p>
            </div>
          ) : (
            <p className="small mute">
              No movement criterion is currently published for this gauge. Criteria are written for
              gauges at orange or red and for any gauge with a live trigger; where none exists, the
              register says so rather than implying one. See the{' '}
              <Link href="/methodology">criterion register</Link>.
            </p>
          )}

          {/* 3. When it was last checked. */}
          {checked ? (
            <p className="small mute" style={{ marginTop: 8 }}>
              Evidence for this reading verified through {checked} ET.
            </p>
          ) : null}

          {/* 4. What it has actually been, recorded rather than drawn. */}
          <HistoryDetail series={byCategory[openCat.key] ?? []} catLabel={openCat.label} />

          <Link className="tile-detail-link" href="/history">
            Full timeline for every category on the history page
          </Link>
        </div>
      ) : null}
    </div>
  );
}
