'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Palette pinned to globals.css, same convention as ShareCard.
const C = {
  bg: '#070d18',
  panel: '#0c1424',
  line: '#1c2a44',
  text: '#e6edf7',
  dim: '#8294ae',
  mute: '#566680',
  acc: '#d2a65f',
};

const LEVEL_HEX = ['#38d183', '#e8c547', '#ef8e3f', '#ef5350'];

const VERDICTS = [
  { label: 'VERIFIED', color: '#38d183' },
  { label: 'PARTIALLY VERIFIED', color: '#e8c547' },
  { label: 'UNVERIFIED', color: '#ef8e3f' },
  { label: 'CONTRADICTED', color: '#ef5350' },
  { label: 'OPINION', color: '#8294ae' },
];

// The eight fixed gauge categories, display labels. Rendered with a four-level
// scale legend, not current readings: a static image must never claim a state.
const GAUGES = [
  'GLOBAL LIQUIDITY',
  'YEN CARRY TRADE',
  'OIL SHOCK RISK',
  'HORMUZ RISK',
  'RISK APPETITE',
  'BOND STRESS',
  'XRP FLOWS',
  'MACRO BACKDROP',
];

const W = 1200;
const H = 675;
const SCALE = 2;
const PAD = 56;

// variant 'default': domain footer baked in. For Discord and general unfurls.
// variant 'x': lower-left kept clear for the X title chip. X crops to 2:1
// (visible band y 37.5 to 637.5) and paints its chip bottom left. Only the left
// side needs the clearance per the Aug 18, 2026 measurements in app/layout.jsx,
// so the gauge board on the right runs deep on both variants.
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

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Terminal grid texture across the full frame
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.28;
    for (let gx = 48; gx < W; gx += 48) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 48; gy < H; gy += 48) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Frame
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // LEFT COLUMN

    // Eyebrow
    try { ctx.letterSpacing = '3px'; } catch (e) {}
    ctx.font = font(600, 17);
    ctx.fillStyle = C.dim;
    ctx.fillText('\u{1F4E1} FROM THE DESK', PAD, 118);

    // Title, two lines, large
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.font = font(700, 52);
    ctx.fillStyle = C.text;
    ctx.fillText('XRP MACRO', PAD, 184);
    ctx.fillText('INTELLIGENCE DESK', PAD, 244);

    // Subline
    try { ctx.letterSpacing = '1.5px'; } catch (e) {}
    ctx.font = font(600, 15);
    ctx.fillStyle = C.mute;
    ctx.fillText('FREE DAILY BRIEF \u00B7 EVIDENCE OVER NARRATIVE', PAD, 288);

    // Verdict header
    ctx.fillStyle = C.acc;
    ctx.fillRect(PAD, 330, 18, 3);
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.font = font(700, 19);
    ctx.fillStyle = C.acc;
    ctx.fillText('EVERY CLAIM GETS A VERDICT', PAD + 28, 339);

    // Verdict chips, two rows so they stay inside the left column
    const chipRow = (list, baseline) => {
      try { ctx.letterSpacing = '1.2px'; } catch (e) {}
      ctx.font = font(600, 14);
      let x = PAD;
      const chipH = 32;
      list.forEach((v) => {
        const tw = ctx.measureText(v.label).width;
        const cw = tw + 26;
        const cy = baseline - 21;
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = v.color;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, cy, cw, chipH, 3);
          ctx.fill();
        } else {
          ctx.fillRect(x, cy, cw, chipH);
        }
        ctx.globalAlpha = 0.65;
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
        ctx.fillText(v.label, x + 13, baseline);
        x += cw + 14;
      });
    };
    chipRow(VERDICTS.slice(0, 3), 392);
    chipRow(VERDICTS.slice(3), 436);

    // Left column ends at y 447. The X chip clearance line is y 530, so both
    // variants are safe on the left; only the footer differs below.

    // RIGHT COLUMN: gauge board, 2 x 4, scale legends
    const boardX = 668;
    const boardW = W - PAD - boardX;
    const gap = 14;
    const tileW = (boardW - gap) / 2;
    const tileH = 108;
    const boardY = 92;

    GAUGES.forEach((label, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = boardX + col * (tileW + gap);
      const y = boardY + row * (tileH + gap);

      ctx.fillStyle = C.panel;
      ctx.fillRect(x, y, tileW, tileH);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, tileW, tileH);
      ctx.fillStyle = C.acc;
      ctx.fillRect(x, y, 4, tileH);

      try { ctx.letterSpacing = '1.5px'; } catch (e) {}
      ctx.font = font(600, 14);
      ctx.fillStyle = C.dim;
      ctx.fillText(label, x + 18, y + 36);

      // Four-level scale bar: the classification range, green through red
      const segGap = 6;
      const segW = (tileW - 36 - segGap * 3) / 4;
      const segY = y + 58;
      LEVEL_HEX.forEach((hex, s) => {
        ctx.fillStyle = hex;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x + 18 + s * (segW + segGap), segY, segW, 10);
        ctx.globalAlpha = 1;
      });

      try { ctx.letterSpacing = '1px'; } catch (e) {}
      ctx.font = font(600, 11);
      ctx.fillStyle = C.mute;
      ctx.fillText('DAILY CLASSIFICATION', x + 18, y + 92);
    });
    // Board ends at y 92 + 4*108 + 3*14 = 566, right side only: chip safe.

    if (variant === 'default') {
      // Footer with domain, same treatment as the daily card
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, H - 64);
      ctx.lineTo(W - PAD, H - 64);
      ctx.stroke();

      try { ctx.letterSpacing = '1px'; } catch (e) {}
      ctx.font = font(700, 22);
      ctx.fillStyle = C.acc;
      ctx.fillText('brief.genxkrypto.com', PAD, H - 26);

      ctx.textAlign = 'right';
      try { ctx.letterSpacing = '1.5px'; } catch (e) {}
      ctx.font = font(600, 12.5);
      ctx.fillStyle = C.mute;
      ctx.fillText('FREE \u00B7 INDEPENDENT \u00B7 NOT FINANCIAL ADVICE', W - PAD, H - 30);
      ctx.textAlign = 'left';
    }
    // variant 'x': no footer. Lower left stays clear for the X title chip, and
    // X prints the domain under the card by itself.

    setDrawn(true);
  }, [variant]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const fam = getComputedStyle(document.body).fontFamily || 'monospace';
      try {
        await Promise.all([
          document.fonts.load(`600 16px ${fam}`),
          document.fonts.load(`700 52px ${fam}`),
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
