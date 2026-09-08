'use client';

import { useMemo, useState } from 'react';
import { VERIFICATION } from '@/lib/format';

// Filter and search shell for the claim tracker.
//
// The cards themselves are rendered on the server and handed in as nodes, so
// markdown, source links and chips keep their existing server rendering and this
// component only decides what is shown and in what order. Nothing is filtered out
// of the record: every claim stays reachable, and clearing the controls returns
// the full list.

// Filter chips run in the same order as the scorecard line above them, so a
// reader can move from the counts to the filters without re-reading. This is
// deliberately NOT the sort order: "open questions first" is about which claims
// deserve attention, and using that ordering for the chips made the two rows
// disagree for no reason a reader could see.
const ORDER = ['verified', 'partially_verified', 'unverified', 'contradicted', 'opinion'];

const SORTS = [
  { key: 'open', label: 'Open questions first' },
  { key: 'updated', label: 'Recently updated' },
];

export default function ClaimsBrowser({ items = [] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('open');

  const counts = useMemo(() => {
    const c = { all: items.length };
    for (const it of items) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = items.filter((it) => {
      if (status !== 'all' && it.status !== status) return false;
      if (!needle) return true;
      return it.haystack.includes(needle);
    });
    rows = rows.slice().sort((a, b) => {
      if (sort === 'updated') return String(b.updatedAt).localeCompare(String(a.updatedAt));
      if (a.rank !== b.rank) return a.rank - b.rank;
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });
    return rows;
  }, [items, q, status, sort]);

  const chips = [{ key: 'all', label: 'All', color: null }].concat(
    ORDER.filter((k) => counts[k]).map((k) => ({
      key: k,
      label: (VERIFICATION[k] || {}).label || k,
      color: (VERIFICATION[k] || {}).color || null,
    }))
  );

  return (
    <div>
      <div style={{ margin: '0 0 12px' }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search claims, evidence and sources"
          aria-label="Search claims"
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 0 10px' }}>
        {chips.map((c) => {
          const on = status === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setStatus(c.key)}
              aria-pressed={on}
              className="small"
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
                border: `1px solid ${on && c.color ? c.color : 'rgba(255,255,255,0.18)'}`,
              }}
            >
              {c.label} {counts[c.key] || 0}
            </button>
          );
        })}
      </div>

      <div
        className="small mute"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', margin: '0 0 16px' }}
      >
        <span>
          Showing {shown.length} of {items.length}
        </span>
        <span aria-hidden="true">·</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSort(s.key)}
            aria-pressed={sort === s.key}
            style={{
              font: 'inherit',
              fontSize: 'inherit',
              padding: 0,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: sort === s.key ? '1px solid currentColor' : '1px solid transparent',
              color: sort === s.key ? 'inherit' : 'var(--mute, rgba(255,255,255,0.6))',
            }}
          >
            {s.label}
          </button>
        ))}
        {q || status !== 'all' ? (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setQ('');
                setStatus('all');
              }}
              style={{
                font: 'inherit',
                fontSize: 'inherit',
                padding: 0,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid currentColor',
                color: 'inherit',
              }}
            >
              Clear
            </button>
          </>
        ) : null}
      </div>

      {shown.length ? (
        shown.map((it) => <div key={it.id}>{it.node}</div>)
      ) : (
        <div className="empty">
          No claims match that search. Clear the filters to see all {items.length} tracked claims.
        </div>
      )}
    </div>
  );
}
