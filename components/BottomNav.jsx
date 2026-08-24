'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActive } from '@/components/NavLinks';

const ITEMS = [
  { href: '/', label: 'Live' },
  { href: '/claims', label: 'Claims' },
  { href: '/history', label: 'History' },
  { href: '/archive', label: 'Archive' },
  { href: '/sources', label: 'Sources' },
];

export default function BottomNav() {
  const pathname = usePathname() || '/';
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((n) => (
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
