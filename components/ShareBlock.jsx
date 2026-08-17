'use client';

import { useState } from 'react';

export default function ShareBlock({ url, text }) {
  const [copied, setCopied] = useState(false);

  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
    url
  )}&via=GenXKrypto`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable in this context; do nothing
    }
  }

  return (
    <div className="share-block">
      <p className="share-copy">
        This desk publishes free, with receipts. If you found this useful, the best support is sharing it.
      </p>
      <div className="share-actions">
        <a className="src-pill" href={intent} target="_blank" rel="noopener noreferrer">
          Share on X <span className="ext">&#8599;</span>
        </a>
        <button type="button" className="src-pill share-btn" onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
