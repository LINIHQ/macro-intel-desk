import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Discord banner variant of the default OG card (added Aug 31, 2026).
// Discord scales embed images to the embed width, so aspect ratio is the only
// lever that shrinks the rendered card; this route serves a crop of
// public/og-card.png instead of the full 1200x630 frame. The crop is done at
// serve time so no second image binary lives in the repo.
// Crop history: v1 was a 1200x320 headline-only band; Phil reviewed it live
// on Aug 31, 2026 and wanted the subline, verdict chips, and domain bar back,
// so the crop now removes only the top brand header (which duplicates the
// Discord embed title line). Result: 1200x488, about 22% shorter than the
// full card. If og-card.png is ever regenerated, re-check CROP_TOP against
// the new art so the band still starts at the kicker line.
// X unfurls are unaffected: X reads twitter:image (og-card-x.png), not this.
const SRC = 'https://brief.genxkrypto.com/og-card.png?v=9';
const CROP_TOP = 142;
const BANNER_W = 1200;
const BANNER_H = 488;

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
    {
      width: BANNER_W,
      height: BANNER_H,
      // Added Sept 11, 2026: this route was re-rendering the same crop on
      // every request (Discord unfurls, repeated visits), each one a full
      // Satori rasterization, real Active CPU for identical output. Caching
      // is safe here specifically because the request URL is already
      // version-busted from app/layout.jsx (OG_IMAGE = '.../og-banner?v=2')
      // and SRC above carries its own ?v= on the source art. Whenever either
      // changes, the existing "bump the ?v=" habit documented in layout.jsx
      // produces a new URL, so this cache can never serve stale art; it can
      // only ever be asked for a URL it hasn't cached yet.
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
