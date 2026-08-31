import './globals.css';
import Link from 'next/link';
import { IBM_Plex_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import NavLinks from '@/components/NavLinks';
import MobileMenu from '@/components/MobileMenu';
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import RefreshOnReturn from '@/components/RefreshOnReturn';

const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono' });

export const revalidate = 60;

const TITLE = 'GenXKrypto | XRP Macro Intelligence Desk';

// Aug 31, 2026: Discord embed slimmed by request. og:site_name and the
// description metas (og:description and the plain description tag) were
// removed. Live test showed Discord then falls back to twitter:description,
// so the "Verified XRP and macro briefs" line still renders under the title;
// Phil reviewed that result and kept it deliberately. Do not remove
// twitter.description without knowing it will strip that line from Discord
// embeds as well as the X card.
const DESCRIPTION = 'Verified XRP and macro briefs, published with sourced receipts.';

// Default unfurl image (Discord, Slack, iMessage, LinkedIn, everything not X).
// As of Aug 31, 2026 this points at /og-banner: a crop of public/og-card.png
// served by app/og-banner/route.jsx. Current crop (v2, Phil-reviewed): the
// full card minus the top brand header, 1200x488, keeping the headline,
// subline, verdict chips, and domain bar. Discord scales embed images to the
// embed width, so the shorter aspect ratio is what makes the rendered card
// more compact. The full 1200x630 art (og-card.png v9, art notes in the route
// file and git history) stays in the repo as the crop source. Bump the ?v=
// buster here whenever og-card.png changes or the route's crop changes.
const OG_IMAGE = 'https://brief.genxkrypto.com/og-banner?v=2';

// X only, below. X reads twitter:* first and falls back to the og:* equivalent
// only when the twitter tag is absent, so these two constants override the
// defaults on X and nowhere else.

// X paints twitter:title as a fixed overlay chip at the bottom left of a
// summary_large_image card. The position is not controllable and the chip cannot
// be suppressed, so the only lever is length: a shorter string means a narrower
// chip. Tested on Aug 18, 2026: a single period ('.') caused X to stop building
// the card entirely rather than falling back to og:title. Do not go shorter than
// a real word here.
const X_CARD_TITLE = 'XRP Macro Brief';

// Separate art for X, 1200x600, desk-styled v3 to match the default (Aug 28,
// 2026). Exactly 2:1, so X applies no crop: the full frame renders. The
// lower-left corner is kept dark and low-detail so the fixed title chip lands
// on a clean area, and the baked domain sits bottom-right only. X prints "From
// brief.genxkrypto.com" beneath the card by itself, which is why the domain
// treatment is lighter here than on the default image. If this art is ever
// regenerated, keep the lower-left clear and keep the file at exactly 2:1 or
// the crop math from the Aug 18, 2026 notes applies again.
const X_CARD_IMAGE = 'https://brief.genxkrypto.com/og-card-x.png?v=8';

export const metadata = {
  metadataBase: new URL('https://brief.genxkrypto.com'),
  title: TITLE,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XRP Brief',
  },
  openGraph: {
    title: TITLE,
    url: '/',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 488, alt: 'GenXKrypto XRP Macro Intelligence Desk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: X_CARD_TITLE,
    description: DESCRIPTION,
    images: [X_CARD_IMAGE],
  },
};

export const viewport = {
  themeColor: '#2f7df6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <RefreshOnReturn />
        <PullToRefresh />
        <header className="site-head">
          <div className="wrap">
            <div className="brand-row">
              <Link href="/" className="brand" aria-label="GenXKrypto home">
                <img src="/avatar.png" alt="GenXKrypto" className="brand-avatar" width="64" height="64" />
                <span className="brand-text">
                  <span className="brand-main">GenXKrypto</span>
                  <span className="brand-sub">xrp macro intelligence desk</span>
                </span>
              </Link>
              <a
                className="x-link"
                href="https://x.com/GenXKrypto"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GenXKrypto on X"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
                </svg>
                <span className="x-label">@GenXKrypto</span>
              </a>
              <MobileMenu />
            </div>
            <NavLinks />
          </div>
        </header>
        <main className="wrap main">{children}</main>
        <footer className="site-foot">
          <div className="wrap">
            <p>Intelligence, not investment advice. Every consequential claim carries a verification status; unverified means unverified.</p>
          </div>
        </footer>
        <BottomNav />
        <Analytics />
      </body>
    </html>
  );
}
