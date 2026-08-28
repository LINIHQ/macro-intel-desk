'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Palette pinned to globals.css, same convention as ShareCard.
const C = {
  bg: '#070d18',
  line: '#1c2a44',
  text: '#e6edf7',
  dim: '#8294ae',
  mute: '#566680',
  acc: '#d2a65f',
};

const VERDICTS = [
  { label: 'VERIFIED', color: '#38d183' },
  { label: 'PARTIALLY VERIFIED', color: '#e8c547' },
  { label: 'UNVERIFIED', color: '#ef8e3f' },
  { label: 'CONTRADICTED', color: '#ef5350' },
  { label: 'OPINION', color: '#8294ae' },
];

const W = 1200;
const H = 675;
const SCALE = 2;
const PAD = 44;

// variant 'default': domain footer baked in. For Discord and general unfurls.
// variant 'x': no footer, bottom strip left clear. X crops to 2:1 (visible band
// y 37.5 to 637.5) and paints its title chip bottom left, so all content stays
// above y 430 and the chip lands on empty background. Matches the crop budget
// documented in app/layout.jsx on Aug 18, 2026.
export default function LinkPreviewCard({ variant = 'default' }) {
  const canvasRef = useRef(null);
  const [drawn, setDrawn] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fam = getComputedStyle(document.body).fontFamily || 'monospace';
    const font = (weight, size) => `${weight} ${size}px ${fam}`;

    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    try { ctx.letterSpacing = '0px'; } catch (e) {}

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // Eyebrow
    try { ctx.letterSpacing = '3px'; } catch (e) {}
    ctx.font = font(600, 18);
    ctx.fillStyle = C.dim;
    ctx.fillText('\u{1F4E1} FROM THE DESK', PAD, 122);

    // Title
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.font = font(700, 42);
    ctx.fillStyle = C.text;
    ctx.fillText('XRP MACRO INTELLIGENCE DESK', PAD, 176);

    // Subline
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.font = font(600, 16);
    ctx.fillStyle = C.mute;
    ctx.fillText('FREE DAILY BRIEF \u00B7 8 MACRO GAUGES \u00B7 PUBLIC CLAIM TRACKER', PAD, 222);

    // Divider
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, 268);
    ctx.lineTo(W - PAD, 268);
    ctx.stroke();

    // Verdict header
    ctx.fillStyle = C.acc;
    ctx.fillRect(PAD, 302, 18, 3);
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.font = font(700, 22);
    ctx.fillStyle = C.acc;
    ctx.fillText('EVERY CLAIM GETS A VERDICT', PAD + 30, 312);

    // Verdict chips row
    try { ctx.letterSpacing = '1.2px'; } catch (e) {}
    ctx.font = font(600, 15);
    let x = PAD;
    const chipBaseline = 378;
    const chipH = 36;
    const chipGap = 16;
    VERDICTS.forEach((v) => {
      const tw = ctx.measureText(v.label).width;
      const cw = tw + 30;
      const cy = chipBaseline - 24;

      ctx.globalAlpha = 0.13;
      ctx.fillStyle = v.color;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, cy, cw, chipH, 3);
        ctx.fill();
      } else {
        ctx.fillRect(x, cy, cw, chipH);
      }
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = v.color;
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, cy, cw, chipH, 3);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, cy, cw, chipH);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = v.color;
      ctx.fillText(v.label, x + 15, chipBaseline);
      x += cw + chipGap;
    });

    if (variant === 'default') {
      // Footer with domain, same treatment as the daily card
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, H - 72);
      ctx.lineTo(W - PAD, H - 72);
      ctx.stroke();

      try { ctx.letterSpacing = '1px'; } catch (e) {}
      ctx.font = font(700, 21);
      ctx.fillStyle = C.acc;
      ctx.fillText('brief.genxkrypto.com', PAD, H - 32);

      ctx.textAlign = 'right';
      try { ctx.letterSpacing = '1.5px'; } catch (e) {}
      ctx.font = font(600, 12.5);
      ctx.fillStyle = C.mute;
      ctx.fillText('FREE \u00B7 INDEPENDENT \u00B7 NOT FINANCIAL ADVICE', W - PAD, H - 36);
      ctx.textAlign = 'left';
    }
    // variant 'x': nothing below the chips. Bottom band stays clear for the
    // X title chip, and X prints the domain under the card by itself.

    setDrawn(true);
  }, [variant]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const fam = getComputedStyle(document.body).fontFamily || 'monospace';
      try {
        await Promise.all([
          document.fonts.load(`600 16px ${fam}`),
          document.fonts.load(`700 42px ${fam}`),
        ]);
      } catch (e) {}
      try { await document.fonts.ready; } catch (e) {}
      if (!cancelled) draw();
    };
    run();
    return () => { cancelled = true; };
  }, [draw]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = variant === 'x' ? 'og-card-x.png' : 'og-card.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
  }, [variant]);

  return (
    <div style={{ marginTop: 20 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxWidth: 720,
          height: 'auto',
          display: 'block',
          border: `1px solid ${C.line}`,
        }}
        aria-label={variant === 'x' ? 'X link preview card' : 'Default link preview card'}
      />
      <div className="share-actions" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="share-cta share-cta-primary"
          onClick={download}
          disabled={!drawn}
        >
          {variant === 'x' ? 'Download og-card-x.png' : 'Download og-card.png'}
        </button>
      </div>
    </div>
  );
}
