'use client';

import { useEffect, useRef, useState } from 'react';

const HOVER_MQ = '(hover: hover) and (pointer: fine)';

// The category labels are NOT inside the scroller, on purpose.
//
// They were a sticky first grid column until Sept 8, 2026. Sticky was tried
// twice and failed twice on iOS: on Sept 4 the labels scrolled partway and
// clipped mid-word ("Global liquidity" rendering as "ity"), and after the
// display: contents wrapper was removed they went away entirely on Sept 8,
// leaving eight unlabelled colour rows on a phone. A dashboard history with no
// category names is not a degraded chart, it is not a chart.
//
// So the dependency is gone rather than patched again. .tl-labels is a static
// flex column sitting beside .tl-scroll; only the track scrolls. Row alignment
// is explicit: each label box and each track is 14px tall with a 10px gap, set
// in globals.css on both columns. Do not move the labels back inside
// .tl-scroll, and if either constant changes, change it on both sides.
//
// Desktop hover tip (rebuilt Sept 14, 2026): used to be a pure-CSS ::after
// pseudo-element positioned relative to the segment button. .tl-scroll has
// overflow-x: auto, and a scroll container clips anything that extends past
// its currently-visible width regardless of z-index or position: absolute,
// so a tip centred on a segment near either edge of the scrolled-into-view
// window got its left or right side cut off (seen live on several segments).
// A separate padding trick already let tips overflow upward past .tl-scroll's
// overflow-y: hidden, but that only reserved room, it did not stop a long tip
// from rendering above the actual browser viewport when a row sat near the
// top of the page (also seen live). Both are the same root cause: the tip was
// positioned relative to a clipping ancestor instead of the viewport.
// Rebuilt as a JS-computed tooltip, shown on mouseenter/focus of a segment,
// rendered position: fixed as a sibling of .tl-wrap so no scrolling ancestor
// can clip it, with its left position clamped to the viewport width and its
// max-height clamped to the room actually available above the segment
// (overflow-y: auto inside that if a tip is unusually long). Hidden on any
// scroll, matching how the touch panel below already closes on scroll.
export default function HistoryTimeline({ rows, dates }) {
  const scrollRef = useRef(null);
  const panelRef = useRef(null);
  const [sel, setSel] = useState(null);
  const [edges, setEdges] = useState({ l: false, r: false });
  const [tip, setTip] = useState(null);

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

  // Hides the hover tip on any scroll (page or the timeline's own horizontal
  // scroll), the same guard the touch panel above already uses: the tip's
  // position is computed once at hover-start from the segment's bounding
  // rect, so a scroll after that would leave it drifted from the segment it
  // describes.
  useEffect(() => {
    if (!tip) return;
    const onScroll = () => setTip(null);
    window.addEventListener('scroll', onScroll, { passive: true });
    const sc = scrollRef.current;
    if (sc) sc.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (sc) sc.removeEventListener('scroll', onScroll);
    };
  }, [tip]);

  const activeRow = sel ? rows.find((r) => r.key === sel.key) : null;
  const active = activeRow ? activeRow.segs[sel.i] : null;

  const toggle = (key, i) => {
    if (typeof window !== 'undefined' && window.matchMedia(HOVER_MQ).matches) return;
    setSel((prev) => (prev && prev.key === key && prev.i === i ? null : { key, i }));
  };

  // Computes a viewport-clamped position from the segment's own bounding rect
  // rather than trusting CSS positioning relative to a clipping ancestor.
  // left is clamped to stay within the viewport on both sides; maxHeight is
  // set to the room actually available between the top of the viewport and
  // the segment, so a long tip scrolls internally instead of rendering above
  // the page. Skipped entirely on touch devices, where segments open the
  // panel below on tap instead.
  const showTip = (e, s) => {
    if (typeof window === 'undefined' || !window.matchMedia(HOVER_MQ).matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const TIP_W = 340;
    const GAP = 8;
    const PAD = 12;
    let left = rect.left + rect.width / 2 - TIP_W / 2;
    left = Math.max(PAD, Math.min(left, window.innerWidth - TIP_W - PAD));
    const bottom = window.innerHeight - rect.top + GAP;
    const maxHeight = Math.max(80, rect.top - GAP - PAD);
    setTip({ text: s.tip, left, bottom, maxHeight });
  };
  const hideTip = () => setTip(null);

  return (
    <>
      <div className={`tl-wrap${edges.l ? ' can-l' : ''}${edges.r ? ' can-r' : ''}`}>
        <div className="tl-labels">
          {rows.map((row) => (
            <span className="tl-label" key={row.key} title={row.label}>
              {row.label}
            </span>
          ))}
        </div>
        <div className="tl-scroll" ref={scrollRef}>
          <div className="tl-grid">
            {rows.map((row) => (
              <div className="tl-track" key={row.key}>
                {row.segs.map((s, i) => {
                  const isSel = sel && sel.key === row.key && sel.i === i;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`tl-seg${s.changed ? ' changed' : ''}${isSel ? ' sel' : ''}`}
                      aria-label={`${row.label}. ${s.tip}`}
                      style={{ background: s.color }}
                      onClick={() => toggle(row.key, i)}
                      onMouseEnter={(e) => showTip(e, s)}
                      onMouseLeave={hideTip}
                      onFocus={(e) => showTip(e, s)}
                      onBlur={hideTip}
                    />
                  );
                })}
              </div>
            ))}
            <div className="tl-dates">
              {dates.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tip ? (
        <div
          className="tl-hover-tip"
          style={{ left: tip.left, bottom: tip.bottom, maxHeight: tip.maxHeight }}
          role="tooltip"
          aria-hidden="true"
        >
          {tip.text}
        </div>
      ) : null}

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
