import './globals.css';
import Link from 'next/link';
import { IBM_Plex_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import NavLinks from '@/components/NavLinks';
import MobileMenu from '@/components/MobileMenu';
import PullToRefresh from '@/components/PullToRefresh';
import RefreshOnReturn from '@/components/RefreshOnReturn';

const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono' });

export const revalidate = 60;

const TITLE = 'GenXKrypto | XRP Macro Intelligence Desk';
const DESCRIPTION = 'Verified XRP and macro intelligence briefs. Evidence over narrative.';
const OG_IMAGE = 'https://brief.genxkrypto.com/og-card.jpg?v=3';

// X only. X paints twitter:title as a fixed overlay chip at the bottom left of a
// summary_large_image card. Position is not controllable and the field cannot be
// empty (an empty value falls back to og:title, then to the page title), so a
// single period is the shortest legal string and keeps the chip minimal.
// Do not reuse this anywhere else: TITLE and openGraph.title carry the real name
// for the browser tab, search results, and every non-X unfurl including Discord.
const X_CARD_TITLE = '.';

export const metadata = {
  metadataBase: new URL('https://brief.genxkrypto.com'),
  title: TITLE,
  description: DESCRIPTION,
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
    description: DESCRIPTION,
    url: '/',
    siteName: 'GenXKrypto XRP Macro Intelligence Desk',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 675, alt: 'GenXKrypto XRP Macro Intelligence Desk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: X_CARD_TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
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
        <Analytics />
      </body>
    </html>
  );
}
