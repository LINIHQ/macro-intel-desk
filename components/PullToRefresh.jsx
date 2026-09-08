'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Only meaningful in standalone/home-screen mode: a normal browser tab already
// has native pull-to-refresh, and this would just fight it.
const THRESHOLD = 72;
const MAX_PULL = 110;
const HOLD = 62; // how far the page stays parked while refreshing
const MIN_SPIN = 750; // router.refresh() often returns instantly; hold the spinner anyway
const PUCK = 34;
const RING = 2 * Math.PI * 8; // r=8 in the 20x20 viewBox

const EASE = 'transform 300ms cubic-bezier(0.2, 0.85, 0.3, 1)';

// Scroll cost rules for this component, learned the hard way on Sept 8, 2026:
//
// 1. The non-passive touchmove listener is the expensive one. A listener
//    registered { passive: false } on document tells WebKit that any touchmove
//    might call preventDefault, so the compositor cannot start scrolling until
//    the main thread has run the handler. That taxes EVERY drag on EVERY page,
//    even the ones where this component does nothing, and it shows up as
//    jerky scrolling rather than as a broken feature. It is now bound only
//    after a touch actually starts at scrollY 0, and released the moment the
//    gesture turns out to be a scroll rather than a pull.
// 2. Browser tabs get nothing at all: no listeners and no fixed layer. The
//    feature was already inert there, it was just still charging rent.
// 3. will-change is applied only while the puck is on screen. Leaving it on
//    permanently keeps a promoted layer alive above a position: fixed layer
//    for the entire session.
export default function PullToRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [baseTop, setBaseTop] = useState(0);

  const startY = useRef(null);
  const active = useRef(false);
  const armed = useRef(false);
  const startedAt = useRef(0);
  const pageEl = useRef(null);
  const busyRef = useRef(false);
  busyRef.current = refreshing;

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    pageEl.current = document.querySelector('main');
    setEnabled(standalone);
  }, []);

  // Drive the page offset imperatively so the whole view travels with the finger.
  const setPageOffset = useCallback((px, animate) => {
    const el = pageEl.current;
    if (!el) return;
    el.style.transition = animate ? EASE : 'none';
    el.style.transform = px ? `translateY(${px}px)` : '';
    el.style.willChange = px ? 'transform' : '';
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let moveBound = false;

    function bindMove() {
      if (moveBound) return;
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      moveBound = true;
    }
    function unbindMove() {
      if (!moveBound) return;
      document.removeEventListener('touchmove', onTouchMove, { passive: false });
      moveBound = false;
    }

    // The gesture is a scroll, not a pull. Let go of the non-passive listener
    // right away so the rest of the drag runs on the compositor.
    function abandon() {
      active.current = false;
      armed.current = false;
      startY.current = null;
      unbindMove();
      setPull(0);
      setPageOffset(0, true);
    }

    function onTouchStart(e) {
      if (busyRef.current) return;
      if (window.scrollY > 0) return;
      if (!pageEl.current) pageEl.current = document.querySelector('main');
      const rect = pageEl.current ? pageEl.current.getBoundingClientRect() : null;
      if (rect) setBaseTop(Math.max(0, Math.round(rect.top)));
      startY.current = e.touches[0].clientY;
      active.current = true;
      bindMove();
    }

    function onTouchMove(e) {
      if (!active.current || startY.current == null) return;
      const delta = e.touches[0].clientY - startY.current;
      // A few pixels of slop before deciding the finger is heading upward,
      // so ordinary jitter at the start of a pull does not cancel it.
      if (window.scrollY > 0 || delta < -6) {
        abandon();
        return;
      }
      if (delta <= 0) return;
      e.preventDefault();
      // Resistance curve: easy at first, stiffer the further it goes.
      const damped = Math.min(MAX_PULL, delta * 0.62 - (delta * delta) / 2600);
      armed.current = damped >= THRESHOLD;
      setPull(damped);
      setPageOffset(damped, false);
    }

    function onTouchEnd() {
      unbindMove();
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (armed.current) {
        if (window.navigator.vibrate) window.navigator.vibrate(8);
        startedAt.current = Date.now();
        setRefreshing(true);
        setPageOffset(HOLD, true);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setPageOffset(0, true);
      }
      armed.current = false;
      setPull(0);
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      unbindMove();
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, router, setPageOffset]);

  // Release the parked page only once the data is in and the spinner has been
  // on screen long enough to read as a refresh rather than a flicker.
  useEffect(() => {
    if (!refreshing || isPending) return;
    const wait = Math.max(0, MIN_SPIN - (Date.now() - startedAt.current));
    const t = setTimeout(() => {
      setRefreshing(false);
      setPageOffset(0, true);
    }, wait);
    return () => clearTimeout(t);
  }, [refreshing, isPending, setPageOffset]);

  useEffect(() => () => setPageOffset(0, false), [setPageOffset]);

  const dragging = pull > 0;
  const progress = Math.min(1, pull / THRESHOLD);
  const ready = progress >= 1;
  const visible = dragging || refreshing;

  // In a browser tab there is no feature here, so there is no fixed layer and
  // no promoted puck sitting over the page for the whole session either.
  if (!enabled) return null;

  const gap = refreshing ? HOLD : pull;
  const translate = visible ? gap / 2 - PUCK / 2 : -PUCK - 8;
  const scale = refreshing ? 1 : 0.6 + 0.4 * progress;
  const opacity = refreshing ? 1 : Math.min(1, pull / 30);

  const puckClass = [
    'ptr-puck',
    visible ? 'ptr-puck-active' : '',
    ready && !refreshing ? 'ptr-puck-ready' : '',
    refreshing ? 'ptr-puck-loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ptr-layer" style={{ top: baseTop }} aria-hidden={!visible}>
      <div
        className={puckClass}
        style={{
          transform: `translateY(${translate}px) scale(${scale})`,
          opacity,
          transition: dragging ? 'opacity 120ms ease' : `${EASE}, opacity 200ms ease`,
        }}
      >
        <svg className="ptr-ring" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <circle className="ptr-ring-track" cx="10" cy="10" r="8" fill="none" strokeWidth="2" />
          <circle
            className="ptr-ring-arc"
            cx="10"
            cy="10"
            r="8"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            style={
              refreshing
                ? undefined
                : { strokeDasharray: RING, strokeDashoffset: RING * (1 - progress * 0.92) }
            }
          />
        </svg>
      </div>
    </div>
  );
}
