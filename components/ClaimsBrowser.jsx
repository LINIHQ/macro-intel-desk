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
//
// Styling for the input and the filter pills lives in globals.css (.search-input,
// .filter-pill) and is shared with ArchiveBrowser, since Sept 13, 2026. An active
// verdict filter passes its semantic colour through --filter-c.
const ORDER = ['verified', 'partially_verified', 'unverified', 'contradicted', 'opinion'];

const SORTS = [
  { key: 'open', label: 'Open questions first' },
  { key: 'updated', label: 'Recently updated' },
];

// Group headers in the ALL view (Sept 14, 2026).
//
// The sort itself is unchanged and stays the default: the claims that deserve a
// reader's attention are the ones the desk has not landed, and leading with 86
// mostly settled, mostly favourable verdicts would bury the desk's exposure on
// the page that exists to show it. What was actually wrong was legibility. In
// ALL, 137 near-identical cards ran in an unbroken stack whose sequence had no
// visible cause, so it read as arbitrary rather than as the output of the sort
// control sitting above it in 13.5px muted text.
//
// Two labelled dividers fix that without touching the editorial call. They also
// double as scroll landmarks, which the stack had none of on a 375px screen.
// Within each group the cards run in the ORDER subsequence above, so the chip
// row and the card stack now disagree about nothing except which block leads.
//
// Rendered only when status is 'all' and sort is 'open'. Under Recently updated
// the order is chronological and explains itself; under a single-status filter
// every card in view is the same verdict and a header would be noise. Counts
// come from what is actually on screen, so a search that narrows the list
// narrows the counts with it.
const GROUPS = {
  open: { label: 'Open questions', hint: 'verdict not yet settled' },
  settled: { label: 'Settled', hint: 'verified, contradicted or opinion' },
};

function GroupHead({ group, count, first }) {
  const meta = GROUPS[group] || { label: group, hint: '' };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px 12px',
        flexWrap: 'wrap',
        margin: first ? '0 0 12px' : '30px 0 12px',
        paddingTop: first ? 0 : 14,
        borderTop: first ? 'none' : '1px solid var(--line)',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--dim)',
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label} <span style={{ color: 'var(--mute)' }}>{count}</span>
      </span>
      {meta.hint ? (
        <span className="mute" style={{ fontSize: 12, letterSpacing: '0.02em' }}>
          {meta.hint}
        </span>
      ) : null}
    </div>
  );
}

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

  const showGroups = status === 'all' && sort === 'open';

  const groupCounts = useMemo(() => {
    const c = {};
    for (const it of shown) c[it.group] = (c[it.group] || 0) + 1;
    return c;
  }, [shown]);

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
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search claims, evidence and sources"
          aria-label="Search claims"
        />
      </div>

      <div className="filter-row" style={{ marginBottom: 10 }}>
        {chips.map((c) => {
          const on = status === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setStatus(c.key)}
              aria-pressed={on}
              className={on ? 'filter-pill on' : 'filter-pill'}
              style={c.color ? { '--filter-c': c.color } : undefined}
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
        <span>Sorted by</span>
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
              borderBottom: sort === s.key ? '1px solid currentColor' : '1px dashed currentColor',
              color: sort === s.key ? 'var(--text)' : 'var(--mute, rgba(255,255,255,0.6))',
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
        shown.map((it, i) => {
          const head =
            showGroups && (i === 0 || shown[i - 1].group !== it.group) ? it.group : null;
          return (
            <div key={it.id}>
              {head ? <GroupHead group={head} count={groupCounts[head] || 0} first={i === 0} /> : null}
              {it.node}
            </div>
          );
        })
      ) : (
        <div className="empty">
          No claims match that search. Clear the filters to see all {items.length} tracked claims.
        </div>
      )}
    </div>
  );
}
