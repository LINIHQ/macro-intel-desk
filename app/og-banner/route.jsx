import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Discord banner variant of the default OG card (added Aug 31, 2026).
// Discord scales embed images to the embed width, so aspect ratio is the only
// lever that shrinks the rendered card; this route serves a 1200x488 window
// onto public/og-card.png instead of the full 1200x630 frame. The crop is done
// at serve time so no second image binary lives in the repo.
// X unfurls are unaffected: X reads twitter:image (og-card-x.png), not this.
//
// Crop history: v1 was a 1200x320 headline-only band; Phil reviewed it live on
// Aug 31, 2026 and wanted the subline, verdict chips, and domain bar back, so
// CROP_TOP was set to remove only the top brand header, which duplicated the
// Discord embed title line.
//
// Sept 13, 2026: og-card.png regenerated with pill-shaped verdict badges,
// believed at the time to be the same layout otherwise, so CROP_TOP was left
// alone pending a visual check.
//
// Sept 17, 2026, and this is the part that matters. That visual check never
// happened, because this route caches its output as immutable and kept serving
// a crop rasterized from the older art. Deploys that day flushed the cache, it
// re-rendered against the current PNG, and the brand header appeared in the
// window: the Sept 13 art had moved down, so 142px no longer lands on the
// kicker line. The window now runs from the header to the bottom edge of the
// frame, catching the full card with nothing cut off.
//
// Phil reviewed that output live and prefers it. So CROP_TOP = 142 is now
// deliberate, and its meaning has inverted: it no longer removes the header,
// it starts the window at the header. Do NOT "restore" the original intent by
// re-measuring this against the kicker line. The duplicate-title argument from
// August lost on the evidence of the rendered card.
//
// What this does mean: the window no longer tracks any named feature of the
// art, so the next regeneration of og-card.png can shift it into nonsense
// silently, exactly as this one did. If og-card.png changes, re-render this
// route and look at the result before trusting it, and re-measure CROP_TOP
// against whatever Phil wants the window to start on.
//
// SRC still points at brief.genxkrypto.com rather than xrpmacro.com. That
// domain stays live permanently to protect the PWA installs registered under
// it, so this resolves, but it is migration leftover and should move to
// xrpmacro.com the next time this file is touched for a real reason. Changing
// it is not free: it is a new upstream URL for the Satori fetch and wants a
// visual check of its own.
const SRC = 'https://brief.genxkrypto.com/og-card.png?v=10';
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
      // version-busted from lib/embed.js (OG_IMAGE = '.../og-banner?v=4')
      // and SRC above carries its own ?v= on the source art. Whenever either
      // changes, the existing "bump the ?v=" habit produces a new URL, so this
      // cache can never serve stale art; it can only ever be asked for a URL
      // it hasn't cached yet.
      //
      // Sept 17, 2026: that reasoning is sound about art the desk changes on
      // purpose, and it was wrong about art changed without bumping the
      // request URL. A deploy is the only thing that flushes this, which is
      // how a crop rendered from pre-Sept-13 art survived four days past the
      // regeneration. Bump the ?v= in lib/embed.js whenever og-card.png
      // changes, not only when this route's own numbers change.
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }
  );
}
