'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Only meaningful in standalone/home-screen mode: a normal browser tab already
// has native pull-to-refresh, and this would just fight it.
const THRESHOLD = 68;
const MAX_PULL = 96;
const RING = 2 * Math.PI * 8; // r=8 in the 20x20 viewBox

export default function PullToRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pull, setPull] = useState(0);
  const startY = useRef(null);
  const active = useRef(false);
  const armed = useRef(false);
  const standalone = useRef(false);
  const pendingRef = useRef(isPending);
  pendingRef.current = isPending;

  useEffect(() => {
    standalone.current =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }, []);

  useEffect(() => {
    function onTouchStart(e) {
      if (!standalone.current || pendingRef.current) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    }
    function onTouchMove(e) {
      if (!active.current || startY.current == null) return;
      if (window.scrollY > 0) {
        active.current = false;
        armed.current = false;
        setPull(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        armed.current = false;
        setPull(0);
        return;
      }
      e.preventDefault();
      const damped = Math.min(MAX_PULL, delta * 0.5);
      armed.current = damped >= THRESHOLD;
      setPull(damped);
    }
    function onTouchEnd() {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      if (armed.current) {
        if (window.navigator.vibrate) window.navigator.vibrate(8);
        startTransition(() => {
          router.refresh();
        });
      }
      armed.current = false;
      setPull(0);
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [router]);

  const visible = pull > 0 || isPending;
  const progress = Math.min(1, pull / THRESHOLD);
  const ready = progress >= 1;

  const translate = isPending ? 58 : 8 + pull * 0.62;
  const scale = isPending ? 1 : 0.55 + 0.45 * progress;
  const opacity = isPending ? 1 : Math.min(1, pull / 26);

  const puckClass = ['ptr-puck', ready ? 'ptr-puck-ready' : '', isPending ? 'ptr-puck-loading' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ptr-layer" aria-hidden={!visible}>
      <div
        className={puckClass}
        style={{ transform: `translateY(${translate}px) scale(${scale})`, opacity }}
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
              isPending
                ? undefined
                : { strokeDasharray: RING, strokeDashoffset: RING * (1 - progress * 0.92) }
            }
          />
        </svg>
      </div>
    </div>
  );
}
