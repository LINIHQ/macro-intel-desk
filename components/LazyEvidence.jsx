'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Added Sept 11, 2026, alongside the /claims Active CPU fix. The full evidence
// record sits inside a collapsed <details> that most readers never open, but a
// Server Component renders its markdown regardless of whether the disclosure is
// open, so every claim's complete (and only ever growing) evidence_md was being
// parsed by react-markdown + remark-gfm on every single page render.
//
// This defers that specific parse to the browser, and only on demand: nothing
// downloads or runs until a reader actually expands a record. The dynamic()
// import keeps the parser out of the claims-page bundle entirely until then.
// The current-assessment paragraph above this component is unaffected and
// stays server-rendered, same as every other Markdown call on the site.
const Markdown = dynamic(() => import('./Markdown'));

export default function LazyEvidence({ evidenceMd, entries }) {
  const [open, setOpen] = useState(false);

  return (
    <details style={{ margin: '10px 0 0' }} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="small mute" style={{ cursor: 'pointer' }}>
        Full evidence record as published, {entries} entries, oldest first
      </summary>
      <div style={{ marginTop: 8 }}>{open ? <Markdown>{evidenceMd}</Markdown> : null}</div>
    </details>
  );
}
