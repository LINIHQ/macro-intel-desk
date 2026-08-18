'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// A home-screen install keeps the page alive in memory for days. Without this,
// someone who opened the desk yesterday and switches back today is still looking
// at yesterday's run, because nothing ever re-asks the server.
//
// Gate matches the ISR window: a brief app switch leaves the page alone, anything
// longer refetches. router.refresh() re-renders server components in place, so
// scroll position and client state survive and an unchanged page shows no flash.
const STALE_AFTER_MS = 60 * 1000;

export default function RefreshOnReturn() {
  const router = useRouter();
  const hiddenAt = useRef(null);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        return;
      }
      if (hiddenAt.current == null) return;
      const away = Date.now() - hiddenAt.current;
      hiddenAt.current = null;
      if (away >= STALE_AFTER_MS) router.refresh();
    }

    // Back/forward and some standalone resumes restore from bfcache, which skips
    // visibilitychange entirely and hands back a fully frozen page.
    function onPageShow(e) {
      if (e.persisted) {
        hiddenAt.current = null;
        router.refresh();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [router]);

  return null;
}
