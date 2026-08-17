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

export default function DashboardGrid({ states }) {
  const [openKey, setOpenKey] = useState(null);
  const rootRef = useRef(null);

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
          return (
            <button
              key={c.key}
              type="button"
              className={isOpen ? 'tile open' : 'tile'}
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
              {s?.changed_from_prior ? <div className="tile-badge">changed this run</div> : null}
            </button>
          );
        })}
      </div>
      {openCat && openState ? (
        <div className="tile-detail" style={{ '--tile-c': openColor }}>
          <div className="tile-detail-head">
            <span className="tile-detail-cat">{openCat.label}</span>
            <span className="tile-detail-val">{openState.label}</span>
          </div>
          <p>{LEVEL_MEANINGS[openState.level]}</p>
          {openState.changed_from_prior ? (
            <p>
              <strong>Changed this run{openState.change_reason ? ':' : '.'}</strong>
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
