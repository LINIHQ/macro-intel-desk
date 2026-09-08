'use client';

import { useMemo, useState } from 'react';

// Filter and search shell for the brief archive.
//
// Rows are rendered on the server and passed in as nodes; this component only
// decides which are shown. Modes are labelled by what the database actually
// stores (quick or full) rather than by an inferred daily/weekly split, because
// a full brief can publish mid-week and mislabelling it here would misrepresent
// the record.

export default function ArchiveBrowser({ items = [] }) {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('all');

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const it of items) c[it.mode] = (c[it.mode] || 0) + 1;
    return c;
  }, [items]);

  const modes = useMemo(
    () =>
      [{ key: 'all', label: 'All briefs' }].concat(
        [
          { key: 'quick', label: 'Morning quick' },
          { key: 'full', label: 'Full' },
        ].filter((m) => counts[m.key])
      ),
    [counts]
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (mode !== 'all' && it.mode !== mode) return false;
      if (!needle) return true;
      return it.haystack.includes(needle);
    });
  }, [items, q, mode]);

  return (
    <div>
      <div style={{ margin: '0 0 12px' }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by date or headline"
          aria-label="Search briefs"
          style={{
            width: '100%',
            padding: '9px 11px',
            font: 'inherit',
            fontSize: '0.92em',
            color: 'inherit',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 2,
            appearance: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          margin: '0 0 14px',
        }}
      >
        {modes.map((m) => {
          const on = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              aria-pressed={on}
              style={{
                font: 'inherit',
                fontSize: '0.78em',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '4px 9px',
                cursor: 'pointer',
                borderRadius: 2,
                color: on ? 'inherit' : 'var(--mute, rgba(255,255,255,0.6))',
                background: on ? 'rgba(255,255,255,0.10)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {m.label} {counts[m.key] || 0}
            </button>
          );
        })}
        <span className="small mute" style={{ marginLeft: 2 }}>
          Showing {shown.length} of {items.length}
        </span>
      </div>

      {shown.length ? (
        <div className="row-list">
          {shown.map((it) => (
            <div key={it.id}>{it.node}</div>
          ))}
        </div>
      ) : (
        <div className="empty">No briefs match that search. Clear it to see all {items.length}.</div>
      )}
    </div>
  );
}
