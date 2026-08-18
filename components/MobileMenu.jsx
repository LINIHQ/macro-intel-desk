'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV, isActive } from './NavLinks';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '/';

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="menu-btn"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      {open && (
        <div className="m-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="m-menu-head">
            <span className="m-menu-title">GenXKrypto</span>
            <button type="button" className="menu-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
          <nav className="m-menu-nav">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={isActive(pathname, n.href) ? 'on' : undefined}
                aria-current={isActive(pathname, n.href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {n.menuLabel || n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
