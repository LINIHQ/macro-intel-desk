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
        <button type="button" className="share-cta share-cta-primary" onClick={copy}>
          {copied ? 'Link copied \u2713' : 'Copy link'}
        </button>
        <a className="share-cta" href={intent} target="_blank" rel="noopener noreferrer">
          Share on X <span className="ext" aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </div>
  );
}
