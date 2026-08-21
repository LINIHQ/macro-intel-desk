'use client';

import { useEffect, useRef } from 'react';

export default function HistoryScroll({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className="tl-scroll" ref={ref}>
      {children}
    </div>
  );
}
