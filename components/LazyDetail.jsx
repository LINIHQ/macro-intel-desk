'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Sept 24, 2026. Same idea as LazyEvidence on the claims page, for the watch
// list: the full detail_md of a watch item sits behind a collapsed disclosure,
// and its markdown is parsed in the browser only when a reader opens it. With
// about fifty active items carrying roughly 64,000 characters of detail between
// them, rendering every record server-side on every request was the wrong
// trade for a page most readers scan on a phone.
const Markdown = dynamic(() => import('./Markdown'));

export default function LazyDetail({ md, label = 'Full detail' }) {
  const [open, setOpen] = useState(false);
  if (!md) return null;

  return (
    <details style={{ margin: '8px 0 0' }} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="small mute" style={{ cursor: 'pointer' }}>
        {label}
      </summary>
      <div style={{ marginTop: 8 }}>{open ? <Markdown>{md}</Markdown> : null}</div>
    </details>
  );
}
