import './globals.css';
import Link from 'next/link';
import { IBM_Plex_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import NavLinks from '@/components/NavLinks';

const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono' });

export const revalidate = 60;

const TITLE = 'GenXKrypto | XRP Macro Intelligence Desk';
const DESCRIPTION = 'Verified XRP and macro intelligence briefs. Evidence over narrative.';

export const metadata = {
  metadataBase: new URL('https://brief.genxkrypto.com'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: 'GenXKrypto XRP Macro Intelligence Desk',
    type: 'website',
    images: [{ url: '/og-card.jpg', width: 1200, height: 675, alt: 'GenXKrypto XRP Macro Intelligence Desk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-card.jpg'],
  },
};

export const viewport = {
  themeColor: '#2f7df6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
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
