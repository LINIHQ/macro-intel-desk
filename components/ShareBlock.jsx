'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';

// The X compose intent used to pass text, url, and via as three separate query
// params (text=..., url=..., via=GenXKrypto). X's compose box concatenates all
// three onto the end of whatever text= already contains with zero separation,
// so a long headline ran straight into the URL and "via @GenXKrypto" with no
// line break, reading as one unbroken paragraph (seen live Sept 13, 2026). The
// url param is dropped and the link is embedded directly in the text with an
// explicit blank line before it, so the compose box reads as body, blank line,
// link, the normal shape of a tweet. X still auto-links a bare https:// URL
// inside the text and counts it against the character limit the same way.
//
// Brief headlines are written as one compound sentence: independent clauses
// joined by semicolons rather than broken into separate sentences (the desk's
// one-line-teaser convention for the headline field). That reads fine wrapped
// in a paragraph on the site; pasted whole into a tweet compose box with no
// line breaks it renders as one unbroken wall of text (seen live Sept 13,
// 2026, on the same brief that hit the URL-spacing bug above). breakClauses
// splits on "; " and inserts a blank line after each semicolon, turning the
// sentence into short paragraphs without touching the wording, the semicolons
// themselves, or anything about how headlines are written upstream.
function breakClauses(str) {
  return str.replace(/;\s+/g, ';\n\n');
}

export default function ShareBlock({ url, text, variant = 'block' }) {
  const [copied, setCopied] = useState(false);

  const shareText = `${breakClauses(text)}\n\n${url}`;
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&via=GenXKrypto`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track('share', { method: 'copy_link', placement: variant });
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
        <a
          className="quiet-link"
          href={intent}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share', { method: 'x_intent', placement: 'inline' })}
        >
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
        <a
          className="share-cta"
          href={intent}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share', { method: 'x_intent', placement: 'block' })}
        >
          Share on X <span className="ext" aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </div>
  );
}
