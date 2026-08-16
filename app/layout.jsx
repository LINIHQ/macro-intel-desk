import './globals.css';
import Link from 'next/link';
import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from 'next/font/google';

const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });
const display = IBM_Plex_Sans_Condensed({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' });

export const revalidate = 60;

export const metadata = {
  title: 'GenXKrypto | XRP Macro Intelligence Desk',
  description: 'Verified XRP and macro intelligence briefs. Evidence over narrative.',
};

const NAV = [
  { href: '/', label: 'Live' },
  { href: '/archive', label: 'Archive' },
  { href: '/history', label: 'History' },
  { href: '/claims', label: 'Claims' },
  { href: '/watch', label: 'Watch' },
  { href: '/sources', label: 'Sources' },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${mono.variable} ${display.variable}`}>
      <body>
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-main">GENXKRYPTO</span>
              <span className="brand-sub">xrp macro intelligence desk</span>
            </Link>
            <nav className="nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>{n.label}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="wrap main">{children}</main>
        <footer className="site-foot">
          <div className="wrap">
            <p>Intelligence, not investment advice. Every consequential claim carries a verification status; unverified means unverified.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
