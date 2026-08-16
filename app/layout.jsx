import './globals.css';
import Link from 'next/link';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import { getLatestStates } from '@/lib/supabase';
import { LEVEL_COLORS } from '@/lib/format';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

export const revalidate = 60;

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

export default async function RootLayout({ children }) {
  const states = await getLatestStates();
  const worst = states.reduce((m, s) => Math.max(m, s.level || 0), 0);
  const stripColor = worst ? LEVEL_COLORS[worst] : 'var(--line)';

  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <div className="status-strip" style={{ background: stripColor }} title="Worst active dashboard classification" />
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
