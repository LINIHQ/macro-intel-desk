'use client';

import { useEffect, useRef, useState } from 'react';

export default function HistoryTimeline({ rows, dates }) {
  const scrollRef = useRef(null);
  const panelRef = useRef(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  useEffect(() => {
    if (!sel) return;

    const onDocClick = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.tl-seg')) return;
      setSel(null);
    };
    const onScroll = () => setSel(null);

    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    const sc = scrollRef.current;
    if (sc) sc.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.removeEventListener('click', onDocClick);
      window.removeEventListener('scroll', onScroll);
      if (sc) sc.removeEventListener('scroll', onScroll);
    };
  }, [sel]);

  const activeRow = sel ? rows.find((r) => r.key === sel.key) : null;
  const active = activeRow ? activeRow.segs[sel.i] : null;

  const toggle = (key, i) => {
    setSel((prev) => (prev && prev.key === key && prev.i === i ? null : { key, i }));
  };

  return (
    <>
      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-grid">
          {rows.map((row) => (
            <div key={row.key} style={{ display: 'contents' }}>
              <span className="tl-label">{row.label}</span>
              <div className="tl-track">
                {row.segs.map((s, i) => {
                  const isSel = sel && sel.key === row.key && sel.i === i;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`tl-seg${s.changed ? ' changed' : ''}${isSel ? ' sel' : ''}`}
                      data-tip={s.tip}
                      aria-label={s.tip}
                      style={{ background: s.color }}
                      onClick={() => toggle(row.key, i)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <span className="tl-label" />
          <div className="tl-dates">
            {dates.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {active ? (
        <div className="tl-panel" role="dialog" aria-label="Brief detail" ref={panelRef}>
          <div className="tl-panel-head">
            <span className="tl-panel-date">{active.date}</span>
            <button
              type="button"
              className="tl-panel-close"
              onClick={() => setSel(null)}
              aria-label="Close detail"
            >
              ✕
            </button>
          </div>
          <p className="tl-panel-status">
            {activeRow.label}: <strong style={{ color: active.color }}>{active.status}</strong>
            {active.changed ? <span className="tl-panel-flag"> · changed this brief</span> : null}
          </p>
          {active.reason ? <p className="tl-panel-reason">{active.reason}</p> : null}
        </div>
      ) : null}
    </>
  );
}
