import './globals.css';
import Link from 'next/link';
import { Inter, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

export const metadata = {
  title: 'GenXKrypto | Macro Intelligence Desk',
  description: 'Verified macro and XRP intelligence briefs. Evidence over narrative.',
};

const NAV = [
  { href: '/', label: 'Live' },
  { href: '/archive', label: 'Archive' },
  { href: '/history', label: 'History' },
  { href: '/claims', label: 'Claims' },
  { href: '/watch', label: 'Watch list' },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <header className="site-head">
          <div className="wrap head-row">
            <Link href="/" className="brand">
              <span className="brand-main">GENXKRYPTO</span>
              <span className="brand-sub">macro intelligence desk</span>
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
