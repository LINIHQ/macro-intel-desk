'use client';

import { useState } from 'react';

export default function ShareBlock({ url, text, variant = 'block' }) {
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

  if (variant === 'inline') {
    return (
      <p className="share-inline small mute">
        Worth sharing?{' '}
        <button type="button" className="quiet-link share-inline-btn" onClick={copy}>
          {copied ? 'Link copied \u2713' : 'Copy link'}
        </button>{' '}
        (Discord, socials, anywhere)
        <span className="share-inline-sep" aria-hidden="true">
          ·
        </span>
        <a className="quiet-link" href={intent} target="_blank" rel="noopener noreferrer">
          Share on X
        </a>{' '}
        (prefilled post)
      </p>
    );
  }

  return (
    <div className="share-block">
      <p className="share-copy">
        This desk publishes free, with receipts. If it's useful, drop or share it in Discord and on your socials, that's how new readers find it. Share on X below gives you a prefilled post, ready to send.
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
