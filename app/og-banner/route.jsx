import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Discord banner variant of the default OG card (added Aug 31, 2026).
// Discord scales embed images to the embed width, so aspect ratio is the only
// lever that shrinks the rendered card; this route serves a 1200x320 center
// band of public/og-card.png (kicker, headline, subline) instead of the full
// 1200x630 frame. The crop is done at serve time so no second image binary
// lives in the repo: if og-card.png is ever regenerated, re-check CROP_TOP
// against the new art so the band still frames the headline.
// X unfurls are unaffected: X reads twitter:image (og-card-x.png), not this.
const SRC = 'https://brief.genxkrypto.com/og-card.png?v=9';
const CROP_TOP = 142;
const BANNER_W = 1200;
const BANNER_H = 320;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: BANNER_W,
          height: BANNER_H,
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: '#070d18',
        }}
      >
        <img
          src={SRC}
          width={1200}
          height={630}
          style={{ marginTop: -CROP_TOP }}
        />
      </div>
    ),
    { width: BANNER_W, height: BANNER_H }
  );
}
