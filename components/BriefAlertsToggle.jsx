'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Public VAPID key for web push. Public by design; the private half lives
// server-side in the desk_config table, readable only by the service role.
const VAPID_PUBLIC_KEY =
  'BIEBoIqhTb4hDrweVWKSgWXqaavgPDkNsokPAxczv98BU-bdEQD0UzxA694R8LjT9f653z5N3i9VnclzYVqjIuI';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

// States:
// loading      probing support and existing subscription
// unsupported  push API absent (iOS Safari tab before Add to Home Screen)
// off          supported, not subscribed
// on           subscribed
// denied       notification permission blocked at the system level
// working      subscribe/unsubscribe in flight
export default function BriefAlertsToggle() {
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    async function probe() {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        if (!cancelled) setState('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setState('denied');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!cancelled) setState(sub ? 'on' : 'off');
      } catch (_) {
        if (!cancelled) setState('off');
      }
    }
    probe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setState('working');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      if (supabase && json && json.endpoint && json.keys) {
        const { error } = await supabase.from('push_subscriptions').insert({
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        });
        // 23505 is a duplicate endpoint: already registered, which is fine.
        if (error && error.code !== '23505') {
          await sub.unsubscribe();
          setState('off');
          return;
        }
      }
      setState('on');
    } catch (_) {
      setState('off');
    }
  }

  async function disable() {
    setState('working');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await sub.unsubscribe();
      // The server row goes stale and is pruned automatically the next time a
      // send hits a dead endpoint. Anon has no delete rights by design.
    } catch (_) {
      // fall through; local unsubscribe is best-effort
    }
    setState('off');
  }

  if (state === 'loading') return null;

  const rowStyle = {
    margin: '0 0 22px',
    padding: '6px 12px',
    borderLeft: '2px solid rgba(255,255,255,0.25)',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  };

  if (state === 'unsupported') {
    return (
      <p className="small mute" style={rowStyle}>
        <span>
          Brief alerts: install the app to your device first (instructions on the{' '}
          <Link className="quiet-link" href="/install">
            install page
          </Link>
          ), then open it and flip the alerts switch to get a notification when a new brief drops.
        </span>
      </p>
    );
  }

  if (state === 'denied') {
    return (
      <p className="small mute" style={rowStyle}>
        <span>Brief alerts: notifications are blocked for this app in your device settings. Allow them there to enable alerts.</span>
      </p>
    );
  }

  const on = state === 'on';

  return (
    <p className="small mute" style={rowStyle}>
      <span>
        {on
          ? 'Brief alerts are on. One notification per brief, when it drops.'
          : (
            <>
              Brief alerts: installed the app from the{' '}
              <Link className="quiet-link" href="/install">
                install page
              </Link>
              ? Flip this switch to get a notification when a new brief drops.
            </>
          )}
      </span>
      <button
        type="button"
        onClick={on ? disable : enable}
        disabled={state === 'working'}
        aria-pressed={on}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.35)',
          color: 'inherit',
          font: 'inherit',
          letterSpacing: 'inherit',
          padding: '3px 10px',
          cursor: state === 'working' ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {state === 'working' ? 'working' : on ? 'alerts: on' : 'alerts: off'}
      </button>
    </p>
  );
}
