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

export default function PullToRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [baseTop, setBaseTop] = useState(0);

  const startY = useRef(null);
  const active = useRef(false);
  const armed = useRef(false);
  const standalone = useRef(false);
  const startedAt = useRef(0);
  const pageEl = useRef(null);
  const busyRef = useRef(false);
  busyRef.current = refreshing;

  useEffect(() => {
    standalone.current =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    pageEl.current = document.querySelector('main');
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
    function onTouchStart(e) {
      if (!standalone.current || busyRef.current) return;
      if (window.scrollY > 0) return;
      if (!pageEl.current) pageEl.current = document.querySelector('main');
      const rect = pageEl.current ? pageEl.current.getBoundingClientRect() : null;
      if (rect) setBaseTop(Math.max(0, Math.round(rect.top)));
      startY.current = e.touches[0].clientY;
      active.current = true;
    }
    function onTouchMove(e) {
      if (!active.current || startY.current == null) return;
      if (window.scrollY > 0) {
        active.current = false;
        armed.current = false;
        setPull(0);
        setPageOffset(0, true);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        armed.current = false;
        setPull(0);
        setPageOffset(0, false);
        return;
      }
      e.preventDefault();
      // Resistance curve: easy at first, stiffer the further it goes.
      const damped = Math.min(MAX_PULL, delta * 0.62 - (delta * delta) / 2600);
      armed.current = damped >= THRESHOLD;
      setPull(damped);
      setPageOffset(damped, false);
    }
    function onTouchEnd() {
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
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [router, setPageOffset]);

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

  const gap = refreshing ? HOLD : pull;
  const translate = visible ? gap / 2 - PUCK / 2 : -PUCK - 8;
  const scale = refreshing ? 1 : 0.6 + 0.4 * progress;
  const opacity = refreshing ? 1 : Math.min(1, pull / 30);

  const puckClass = ['ptr-puck', ready && !refreshing ? 'ptr-puck-ready' : '', refreshing ? 'ptr-puck-loading' : '']
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
