'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Live' },
  { href: '/archive', label: 'Archive' },
  { href: '/history', label: 'History' },
  { href: '/claims', label: 'Claims' },
  { href: '/watch', label: 'Watch List' },
  { href: '/sources', label: 'Sources' },
];

function isActive(pathname, href) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/brief');
  return pathname === href || pathname.startsWith(href + '/');
}

export default function NavLinks() {
  const pathname = usePathname() || '/';
  return (
    <nav className="nav">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={isActive(pathname, n.href) ? 'on' : undefined}
          aria-current={isActive(pathname, n.href) ? 'page' : undefined}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
