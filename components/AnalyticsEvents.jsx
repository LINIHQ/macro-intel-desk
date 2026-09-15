'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';

// Custom events, added Sept 15, 2026 (Vercel Pro). Each one answers a
// specific question about how the desk is used; nothing here is collected for
// its own sake. Events carry no identifier, no free text, and nothing a reader
// types. The Privacy page lists every event, so keep the two in sync.
//
// This component handles the events that do not belong to one component:
//   app_installed        Chromium's appinstalled event (Android and desktop
//                        Chrome; iOS never fires it).
//   app_open_standalone  the site opened as an installed app, on any platform,
//                        once per full page load. This is the iOS-inclusive
//                        measure of how many installs are actually used.
//   [data-track] clicks  delegated listener, so server components (for example
//                        SourcePills) can be tracked with a data attribute
//                        instead of becoming client components.
//
// A tracked element carries data-track="event_name" plus optional
// data-track-<prop> attributes, which become event properties. The page
// property is added automatically, with brief ids collapsed to /brief so the
// dashboard groups by page type rather than by run.

function coarseOs() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function pageType() {
  const p = window.location.pathname || '/';
  if (p.startsWith('/brief/')) return '/brief';
  return p;
}

export default function AnalyticsEvents() {
  useEffect(() => {
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
    if (standalone) track('app_open_standalone', { os: coarseOs() });

    function onInstalled() {
      track('app_installed', { os: coarseOs() });
    }

    function onClick(e) {
      const el = e.target && e.target.closest ? e.target.closest('[data-track]') : null;
      if (!el) return;
      const props = { page: pageType() };
      Object.keys(el.dataset).forEach((k) => {
        if (k.startsWith('track') && k !== 'track') {
          const name = k.slice(5).charAt(0).toLowerCase() + k.slice(6);
          props[name] = String(el.dataset[k]).slice(0, 100);
        }
      });
      track(el.dataset.track, props);
    }

    window.addEventListener('appinstalled', onInstalled);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
