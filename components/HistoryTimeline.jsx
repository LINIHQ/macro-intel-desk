'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

const HOVER_MQ = '(hover: hover) and (pointer: fine)';

// The label column is sticky at left: 0 so category names hold their position
// while the track scrolls under them. Each row used to be wrapped in a
// <div style={{ display: 'contents' }}> to get the label and track placed as
// grid items. That wrapper broke sticky in WebKit: position: sticky on an
// element whose parent is display: contents does not hold in Safari, so on
// iPhone the labels scrolled away with the track the moment the timeline
// anchored itself to the newest brief on mount, leaving them clipped mid-word
// ("Global liquidity" rendering as "ity"). Seen live Sept 4, 2026.
//
// Fragment emits no DOM node at all, so the label and track are true direct
// children of .tl-grid: identical grid placement, and sticky behaves. Do not
// reintroduce a wrapper element around these two, with display: contents or
// otherwise, without testing the History page on a real iPhone first.
const LABEL_TEXT_STYLE = {
  display: 'block',
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default function HistoryTimeline({ rows, dates }) {
  const scrollRef = useRef(null);
  const panelRef = useRef(null);
  const [sel, setSel] = useState(null);
  const [edges, setEdges] = useState({ l: false, r: false });

  // Anchor the view at the newest brief and keep the edge fades in sync.
  // A single scrollLeft set on mount is unreliable on iOS WebKit (it can land
  // before layout settles and silently lose), so the anchor retries across a
  // frame and a short timeout, guarded so it never fights a user who has
  // already started scrolling.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setEdges({
        l: el.scrollLeft > 4,
        r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };

    let userMoved = false;
    const markMoved = () => {
      userMoved = true;
    };

    const anchor = () => {
      if (!userMoved) el.scrollLeft = el.scrollWidth;
      update();
    };

    el.addEventListener('pointerdown', markMoved, { passive: true });
    el.addEventListener('touchstart', markMoved, { passive: true });
    el.addEventListener('wheel', markMoved, { passive: true });
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    anchor();
    const raf = requestAnimationFrame(anchor);
    const t = setTimeout(anchor, 300);

    return () => {
      el.removeEventListener('pointerdown', markMoved);
      el.removeEventListener('touchstart', markMoved);
      el.removeEventListener('wheel', markMoved);
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!sel) return;

    const onDocClick = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.tl-seg')) return;
      setSel(null);
    };
    const onScroll = () => setSel(null);

    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    const sc = scrollRef.current;
    if (sc) sc.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onScroll);
      if (sc) sc.removeEventListener('scroll', onScroll);
    };
  }, [sel]);

  const activeRow = sel ? rows.find((r) => r.key === sel.key) : null;
  const active = activeRow ? activeRow.segs[sel.i] : null;

  const toggle = (key, i) => {
    if (typeof window !== 'undefined' && window.matchMedia(HOVER_MQ).matches) return;
    setSel((prev) => (prev && prev.key === key && prev.i === i ? null : { key, i }));
  };

  return (
    <>
      <div className={`tl-wrap${edges.l ? ' can-l' : ''}${edges.r ? ' can-r' : ''}`}>
        <div className="tl-scroll" ref={scrollRef}>
          <div className="tl-grid">
            {rows.map((row) => (
              <Fragment key={row.key}>
                <span className="tl-label">
                  <span style={LABEL_TEXT_STYLE}>{row.label}</span>
                </span>
                <div className="tl-track">
                  {row.segs.map((s, i) => {
                    const isSel = sel && sel.key === row.key && sel.i === i;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`tl-seg${s.changed ? ' changed' : ''}${isSel ? ' sel' : ''}`}
                        data-tip={s.tip}
                        aria-label={s.tip}
                        style={{ background: s.color }}
                        onClick={() => toggle(row.key, i)}
                      />
                    );
                  })}
                </div>
              </Fragment>
            ))}
            <span className="tl-label" />
            <div className="tl-dates">
              {dates.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {active ? (
        <div className="tl-panel" role="dialog" aria-label="Brief detail" ref={panelRef}>
          <div className="tl-panel-head">
            <span className="tl-panel-date">{active.date}</span>
            <button
              type="button"
              className="tl-panel-close"
              onClick={() => setSel(null)}
              aria-label="Close detail"
            >
              ✕
            </button>
          </div>
          <p className="tl-panel-status">
            {activeRow.label}: <strong style={{ color: active.color }}>{active.status}</strong>
            {active.changed ? <span className="tl-panel-flag"> · changed this brief</span> : null}
          </p>
          {active.reason ? <p className="tl-panel-reason">{active.reason}</p> : null}
        </div>
      ) : null}
    </>
  );
}
