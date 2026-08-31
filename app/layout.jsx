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
// description metas (both og:description and the plain description tag) were
// removed so the Discord unfurl renders only the title plus the card image.
// Discord falls back to the plain description tag when og:description is
// absent, which is why both had to go. The DESCRIPTION string below now feeds
// the X card only; restore it to metadata.description and openGraph.description
// to bring the fuller embed back.
const DESCRIPTION = 'Verified XRP and macro briefs, published with sourced receipts.';

// Default card art, 1200x630, desk-styled v3: large "Evidence over narrative"
// headline, full five-verdict chip row, no dashboard grid (removed for
// thumbnail legibility, v3), photographic deep-space background with a glowing
// data-network motif on the right side echoing the avatar's circuit styling.
// v3 art committed Aug 28, 2026 after v1 (space poster replacement) and v2
// (dashboard-grid version, found too dense/boring at real embed size). Used by
// Discord, Slack, iMessage, LinkedIn, and every unfurl that is not X. Bump the
// ?v= buster whenever the file changes.
const OG_IMAGE = 'https://brief.genxkrypto.com/og-card.png?v=9';

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
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'GenXKrypto XRP Macro Intelligence Desk' }],
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
