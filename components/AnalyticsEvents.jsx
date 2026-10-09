'use client';

import { useEffect } from 'react';
import { track } from '@vercel/analytics';
import { supabase } from '@/lib/supabase';

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
//   utm_landing          (Oct 9, 2026) a visit that arrived on a link carrying
//                        utm_ tags, i.e. one of the desk's own tagged posts.
//                        See captureUtm below.
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

// UTM landings (Oct 9, 2026). Vercel shows UTM parameters only on a paid
// add-on, so tagged landings are recorded two free ways:
//   1. a utm_landing custom event in the existing Vercel Events panel, and
//   2. one row in the Supabase utm_visits table, which the public role can
//      insert into but never read. The desk reads it with the service role
//      and joins it to x_post_log by day and medium.
// Only links that carry utm_source are recorded; ordinary visits record
// nothing here. Values are lowercased and limited to [a-z0-9._-], 64 chars,
// matching the table's check constraints, so nothing a reader could type
// arrives as free text. No identifier is stored: a sessionStorage flag (not a
// cookie, cleared when the tab closes) only stops a refresh of the same tagged
// link from counting twice. The URL is deliberately NOT rewritten to strip the
// tags, because changing the search params in the app router would make
// @vercel/analytics record a second page view.
function clean(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 64);
  return s || null;
}

function captureUtm() {
  let params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch (_) {
    return;
  }
  const source = clean(params.get('utm_source'));
  if (!source) return;
  const medium = clean(params.get('utm_medium'));
  const campaign = clean(params.get('utm_campaign'));
  const content = clean(params.get('utm_content'));
  const path = pageType().slice(0, 64);
  const os = coarseOs();

  const flag = `xmd_utm:${source}:${medium || ''}:${campaign || ''}:${content || ''}`;
  try {
    if (window.sessionStorage.getItem(flag)) return;
    window.sessionStorage.setItem(flag, '1');
  } catch (_) {
    // Storage can throw in private windows; count the visit anyway.
  }

  const props = { source, medium: medium || 'none', page: path };
  if (campaign) props.campaign = campaign;
  if (content) props.content = content;
  track('utm_landing', props);

  if (supabase) {
    // No .select(): the public role has insert only, so asking for the row
    // back would fail. Errors are swallowed; measurement never breaks a page.
    supabase
      .from('utm_visits')
      .insert({
        utm_source: source,
        utm_medium: medium,
        utm_campaign: campaign,
        utm_content: content,
        landing_path: path,
        os,
      })
      .then(
        () => {},
        () => {}
      );
  }
}

export default function AnalyticsEvents() {
  useEffect(() => {
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
    if (standalone) track('app_open_standalone', { os: coarseOs() });

    captureUtm();

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
