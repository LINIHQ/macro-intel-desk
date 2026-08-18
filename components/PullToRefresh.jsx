'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Only meaningful in standalone/home-screen mode: a normal browser tab already
// has native pull-to-refresh, and this would just fight it.
const THRESHOLD = 68;
const MAX_PULL = 88;

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
  const height = isPending ? 40 : Math.round(pull);
  const containerClass = ['ptr-indicator', visible ? 'ptr-indicator-visible' : '', armed.current ? 'ptr-indicator-armed' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} style={{ height }} aria-hidden={!visible}>
      <span
        className={`ptr-spin${isPending ? ' ptr-spin-loading' : ''}`}
        style={!isPending ? { transform: `rotate(${Math.round(pull * 2.4)}deg)` } : undefined}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 12a8 8 0 0 1 8-8 8 8 0 0 1 7.4 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M19.5 4.5v5h-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
