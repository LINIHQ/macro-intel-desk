'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Fixed palette mirroring globals.css. The canvas cannot read CSS variables at
// draw time across all targets, so these are pinned here. If the site palette
// changes, update both places.
const C = {
  bg: '#070d18',
  panel: '#0c1424',
  panel2: '#111b30',
  line: '#1c2a44',
  text: '#e6edf7',
  body: '#a7b6cc',
  dim: '#8294ae',
  mute: '#566680',
  acc: '#d2a65f',
};

const LEVEL_HEX = { 1: '#38d183', 2: '#e8c547', 3: '#ef8e3f', 4: '#ef5350' };

const VERDICT_HEX = {
  verified: { label: 'VERIFIED', color: '#38d183' },
  partially_verified: { label: 'PARTIALLY VERIFIED', color: '#e8c547' },
  unverified: { label: 'UNVERIFIED', color: '#ef8e3f' },
  contradicted: { label: 'CONTRADICTED', color: '#ef5350' },
  opinion: { label: 'OPINION', color: '#8294ae' },
};

const W = 1200;
const H = 675;
const SCALE = 2;
const PAD = 44;

function truncate(ctx, str, maxWidth) {
  if (ctx.measureText(str).width <= maxWidth) return str;
  let s = str;
  while (s.length > 1 && ctx.measureText(s + '\u2026').width > maxWidth) {
    s = s.slice(0, -1);
  }
  return s.trimEnd() + '\u2026';
}

export default function ShareCard({ dateLabel, modeLabel, runDate, gauges, items }) {
  const canvasRef = useRef(null);
  const [drawn, setDrawn] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use the exact font stack the site loads (next/font hashed family name),
    // read from the live document so the canvas matches the rendered site.
    const fam = getComputedStyle(document.body).fontFamily || 'monospace';
    const font = (weight, size) => `${weight} ${size}px ${fam}`;

    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    try {
      ctx.letterSpacing = '0px';
    } catch (e) {
      // letterSpacing unsupported: rendering still works, just tighter tracking
    }

    // Background and frame
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Header: eyebrow, title, right-side date and tagline
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    try { ctx.letterSpacing = '2px'; } catch (e) {}
    ctx.font = font(600, 16);
    ctx.fillStyle = C.dim;
    ctx.fillText('\u{1F4E1} FROM THE DESK', PAD, 72);

    ctx.font = font(700, 31);
    ctx.fillStyle = C.text;
    ctx.fillText('XRP MACRO INTELLIGENCE DESK', PAD, 110);

    ctx.textAlign = 'right';
    try { ctx.letterSpacing = '1.5px'; } catch (e) {}
    ctx.font = font(600, 14);
    ctx.fillStyle = C.mute;
    ctx.fillText(`${dateLabel} \u00B7 ${modeLabel}`.toUpperCase(), W - PAD, 70);
    ctx.font = font(600, 12);
    ctx.fillStyle = C.acc;
    ctx.fillText('EVERY CLAIM GETS A VERDICT', W - PAD, 94);
    ctx.textAlign = 'left';

    // Gauge grid: 4 columns x 2 rows
    const gap = 14;
    const tileW = (W - PAD * 2 - gap * 3) / 4;
    const tileH = 84;
    const gridY = 142;

    (gauges || []).slice(0, 8).forEach((g, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = PAD + col * (tileW + gap);
      const y = gridY + row * (tileH + gap);
      const lc = LEVEL_HEX[g.level] || C.mute;

      ctx.fillStyle = C.panel;
      ctx.fillRect(x, y, tileW, tileH);
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = lc;
      ctx.fillRect(x, y, tileW, tileH);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, tileW, tileH);
      ctx.fillStyle = lc;
      ctx.fillRect(x, y, 4, tileH);

      try { ctx.letterSpacing = '1.5px'; } catch (e) {}
      ctx.font = font(600, 12);
      ctx.fillStyle = C.dim;
      ctx.fillText(truncate(ctx, (g.label || '').toUpperCase(), tileW - 30), x + 17, y + 30);

      try { ctx.letterSpacing = '0.5px'; } catch (e) {}
      ctx.font = font(700, 19);
      ctx.fillStyle = lc;
      ctx.fillText(truncate(ctx, (g.value || '').toUpperCase(), tileW - 30), x + 17, y + 62);
    });

    // Top 3 section
    const sectY = gridY + tileH * 2 + gap + 42;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, sectY - 26);
    ctx.lineTo(W - PAD, sectY - 26);
    ctx.stroke();

    ctx.fillStyle = C.acc;
    ctx.fillRect(PAD, sectY - 10, 16, 3);
    try { ctx.letterSpacing = '3px'; } catch (e) {}
    ctx.font = font(600, 13);
    ctx.fillStyle = C.dim;
    ctx.fillText('TOP 3 SIGNALS', PAD + 26, sectY);

    // Items: rank, title, verdict chip
    const rowStart = sectY + 40;
    const rowGap = 58;

    (items || []).slice(0, 3).forEach((it, i) => {
      const y = rowStart + i * rowGap;
      const ver = VERDICT_HEX[it.verification] || VERDICT_HEX.opinion;

      // Verdict chip, right aligned
      try { ctx.letterSpacing = '1.2px'; } catch (e) {}
      ctx.font = font(600, 11);
      const chipTextW = ctx.measureText(ver.label).width;
      const chipW = chipTextW + 22;
      const chipH = 24;
      const chipX = W - PAD - chipW;
      const chipY = y - 16;

      ctx.globalAlpha = 0.13;
      ctx.fillStyle = ver.color;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(chipX, chipY, chipW, chipH, 2);
        ctx.fill();
      } else {
        ctx.fillRect(chipX, chipY, chipW, chipH);
      }
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = ver.color;
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(chipX, chipY, chipW, chipH, 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(chipX, chipY, chipW, chipH);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = ver.color;
      ctx.fillText(ver.label, chipX + 11, y);

      // Rank and title
      try { ctx.letterSpacing = '0px'; } catch (e) {}
      ctx.font = font(600, 18);
      ctx.fillStyle = C.acc;
      ctx.fillText(`${it.rank}.`, PAD, y);
      ctx.fillStyle = C.text;
      const titleX = PAD + 36;
      const titleMax = chipX - titleX - 18;
      ctx.fillText(truncate(ctx, it.title || '', titleMax), titleX, y);
    });

    // Footer: divider, domain, positioning line
    const footLineY = H - 72;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, footLineY);
    ctx.lineTo(W - PAD, footLineY);
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

    setDrawn(true);
  }, [dateLabel, modeLabel, gauges, items]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const fam = getComputedStyle(document.body).fontFamily || 'monospace';
      try {
        await Promise.all([
          document.fonts.load(`400 16px ${fam}`),
          document.fonts.load(`600 16px ${fam}`),
          document.fonts.load(`700 31px ${fam}`),
        ]);
      } catch (e) {
        // Fall through: fonts.ready below still gates on whatever loaded
      }
      try {
        await document.fonts.ready;
      } catch (e) {}
      if (!cancelled) draw();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [draw]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `desk-card-${runDate || 'latest'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, 'image/png');
  }, [runDate]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxWidth: 720,
          height: 'auto',
          display: 'block',
          border: `1px solid ${C.line}`,
        }}
        aria-label="Daily share card preview"
      />
      <div className="share-actions" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="share-cta share-cta-primary"
          onClick={download}
          disabled={!drawn}
        >
          Download PNG
        </button>
      </div>
      <p className="small mute" style={{ marginTop: 12 }}>
        1200 x 675 at 2x resolution. Attach to the parent post on X. On mobile, tap
        Download PNG and save to photos.
      </p>
    </div>
  );
}
