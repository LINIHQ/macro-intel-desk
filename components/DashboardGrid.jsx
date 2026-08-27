'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, LEVEL_COLORS, stateFor } from '@/lib/format';
import { CATEGORY_ICONS } from '@/components/Icons';
import TrendLine from '@/components/TrendLine';

// Risk gauges: higher level means more risk, so the line points UP when hot.
// Condition gauges: higher level means worse conditions, so the line points DOWN when bad.
const RISK_KEYS = new Set(['yen_carry_trade', 'oil_shock_risk', 'hormuz_risk', 'bond_market_stress']);

// Level meanings mirror the rubric published on the Sources page. Keep the two in sync.
const LEVEL_MEANINGS = {
  1: 'Baseline. Conditions normal or supportive; nothing demanding attention.',
  2: 'Watch. Early signals worth tracking, not yet confirmed by hard evidence.',
  3: 'Elevated. Verified evidence of active stress or deterioration; this variable is moving.',
  4: 'Regime-level. Disruption or stress severe enough to change the macro picture, declared only on confirmed events.',
};

function directionFor(key, level) {
  if (level == null) return 'flat';
  if (RISK_KEYS.has(key)) {
    return level >= 3 ? 'up' : 'flat';
  }
  if (level === 1) return 'up';
  if (level >= 3) return 'down';
  return 'flat';
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

export default function DashboardGrid({ states }) {
  const [openKey, setOpenKey] = useState(null);
  const rootRef = useRef(null);
  const detailRef = useRef(null);

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

  return (
    <div ref={rootRef}>
      <div className="dash-grid">
        {CATEGORIES.map((c) => {
          const s = stateFor(states, c.key);
          const color = s ? LEVEL_COLORS[s.level] : 'var(--mute)';
          const direction = directionFor(c.key, s?.level ?? null);
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
              <div className="tile-mid">
                <div className="tile-val">{s ? s.label : '--'}</div>
                <TrendLine direction={direction} seedKey={c.key} />
              </div>
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
          <p>{LEVEL_MEANINGS[openState.level]}</p>
          {openState.trend && openState.trend_note ? (
            <p>
              <strong>Trend, criterion-gated:</strong> {openState.trend_note} An arrow appears only when a pre-registered movement criterion is partially met or a tracked level is converging on a trigger; the classification itself moves only when the criterion fires.
            </p>
          ) : null}
          {openState.changed_from_prior ? (
            <p>
              <strong>Changed in this brief{openState.change_reason ? ':' : '.'}</strong>
              {openState.change_reason ? ` ${openState.change_reason}` : ''}
            </p>
          ) : null}
          <Link className="tile-detail-link" href="/history">
            Full timeline for every category on the history page
          </Link>
        </div>
      ) : null}
    </div>
  );
}
