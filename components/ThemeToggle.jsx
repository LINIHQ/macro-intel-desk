'use client';

import { track } from '@vercel/analytics';
import { THEME_KEY } from '@/lib/theme';

// Light / dark mode switch (Sept 26, 2026).
//
// Dark is the default and stays the default: nobody sees a change unless they
// tap this. The choice is stored in localStorage under THEME_KEY and applied as
// data-theme="light" on <html> by the inline script in app/layout.jsx, which
// runs before first paint so a light-mode reader never sees a dark flash on a
// cached page. Per browser, not per person: Discord's in-app browser, Safari
// and the installed app each remember their own choice.
//
// Both labels are always in the markup and CSS shows the right one based on
// data-theme. Nothing here reads the theme during render, so the server HTML
// and the client agree (no hydration mismatch) and the label is correct on
// the very first frame. The label names what a tap does, not the current mode.

function Sun() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.1" y2="4.9" />
    </svg>
  );
}

function Moon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.8 6.8 0 0 0 11 11Z" />
    </svg>
  );
}

export default function ThemeToggle({ className = '' }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (next === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode or blocked storage: the switch still works for this visit.
    }
    try {
      track('theme_toggle', { to: next });
    } catch {
      // Analytics must never break the control.
    }
  }

  return (
    <button type="button" className={`theme-toggle ${className}`.trim()} onClick={toggle}>
      <span className="tt-to-light">
        <Sun />
        Light mode
      </span>
      <span className="tt-to-dark">
        <Moon />
        Dark mode
      </span>
    </button>
  );
}
