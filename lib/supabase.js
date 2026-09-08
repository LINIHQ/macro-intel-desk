import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function getLatestBrief() {
  if (!supabase) return null;
  const { data } = await supabase
    .from('briefs')
    .select('*, dashboard_states(*), brief_items(*)')
    .eq('published', true)
    .order('run_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function getLatestStates() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('briefs')
    .select('dashboard_states(level)')
    .eq('published', true)
    .order('run_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.dashboard_states ?? [];
}

// Status history per category across all published runs, oldest first.
// Returns { [category]: [{ level, date }, ...] } for the dashboard run-history blocks.
export async function getStateHistory() {
  if (!supabase) return {};
  const { data } = await supabase
    .from('briefs')
    .select('run_date, created_at, dashboard_states(category, level)')
    .eq('published', true)
    .order('run_date', { ascending: true })
    .order('created_at', { ascending: true });
  const map = {};
  for (const b of data ?? []) {
    for (const s of b.dashboard_states ?? []) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push({ level: s.level, date: b.run_date });
    }
  }
  return map;
}

// Run-aligned classification history for the dashboard tiles.
//
// Deliberately separate from getStateHistory, which packs each category's rows
// tightly and is fine for the history page but wrong for the tiles: if a run
// recorded no level for one category, that category's array shifts and its strip
// no longer lines up with the other seven. Here every category gets one entry per
// run in the window, and a run with no recorded level for that category becomes an
// explicit null so the gap is drawn as a gap rather than closed silently.
//
// asOf (a run_date) ends the window at that date, for archived brief pages: a
// permalink for Aug 21 should not show classifications recorded in September,
// which the reader on that page has no way to interpret. Same-day resolution
// only, so on a day with more than one published run the window includes both.
//
// Returns { runs: [{ id, date }], byCategory: { [key]: [ {level,label,date} | null ] } }
// with runs oldest first, so all eight strips share one window and one x axis.
export async function getClassificationHistory(limit = 24, asOf = null) {
  if (!supabase) return { runs: [], byCategory: {} };
  let q = supabase
    .from('briefs')
    .select('id, run_date, created_at, dashboard_states(category, level, label)')
    .eq('published', true);
  if (asOf) q = q.lte('run_date', asOf);
  const { data } = await q
    .order('run_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  const runs = (data ?? []).slice().reverse();
  const seen = {};
  for (const b of runs) {
    for (const s of b.dashboard_states ?? []) {
      if (!seen[s.category]) seen[s.category] = {};
      seen[s.category][b.id] = { level: s.level, label: s.label };
    }
  }

  const byCategory = {};
  for (const cat of Object.keys(seen)) {
    byCategory[cat] = runs.map((b) => {
      const s = seen[cat][b.id];
      return s ? { level: s.level, label: s.label, date: b.run_date } : null;
    });
  }

  return { runs: runs.map((b) => ({ id: b.id, date: b.run_date })), byCategory };
}

// Currently in-force pre-registered movement criteria, one or two rows per gauge.
// The tiles read their "what would change this" answer from the same register the
// public criterion page reads, so a tile can never state a test the register has
// already superseded. Returns { [category]: { worsen, improve } }.
export async function getCurrentCriteria() {
  if (!supabase) return {};
  const { data } = await supabase
    .from('gauge_criteria')
    .select('category, direction, criterion_md, effective_date')
    .eq('is_current', true)
    .order('effective_date', { ascending: false });
  const map = {};
  for (const r of data ?? []) {
    if (!map[r.category]) map[r.category] = {};
    if (!map[r.category][r.direction]) {
      map[r.category][r.direction] = { text: r.criterion_md, since: r.effective_date };
    }
  }
  return map;
}

// The criteria that were in force on a given run_date, for archived brief pages.
//
// getCurrentCriteria answers "what is the test now" and is right for the live
// page. It is wrong for a permalink: an archived brief should show the test as
// it stood when it published, otherwise the page silently restates a criterion
// the desk had not written yet. The register is append-only with effective and
// superseded dates, so the row in force on a date is the newest one effective on
// or before it that had not been superseded by then. A row superseded on the run
// date itself is out, because its replacement took effect that same day.
//
// Returns the same shape as getCurrentCriteria: { [category]: { worsen, improve } }.
export async function getCriteriaAsOf(runDate) {
  if (!supabase || !runDate) return {};
  const { data } = await supabase
    .from('gauge_criteria')
    .select('category, direction, criterion_md, effective_date, superseded_date')
    .lte('effective_date', runDate)
    .order('effective_date', { ascending: false });
  const map = {};
  for (const r of data ?? []) {
    if (r.superseded_date && r.superseded_date <= runDate) continue;
    if (!map[r.category]) map[r.category] = {};
    if (!map[r.category][r.direction]) {
      map[r.category][r.direction] = { text: r.criterion_md, since: r.effective_date };
    }
  }
  return map;
}

// Full criterion register for the public methodology page: every criterion the
// desk has published for any gauge, current and superseded, newest first.
export async function getCriteriaRegister() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('gauge_criteria')
    .select('*')
    .order('effective_date', { ascending: false })
    .order('category', { ascending: true });
  return data ?? [];
}

export async function getDeskConfig(keys = []) {
  if (!supabase) return {};
  let q = supabase.from('desk_config').select('key, value');
  if (keys.length) q = q.in('key', keys);
  const { data } = await q;
  const map = {};
  for (const r of data ?? []) map[r.key] = r.value;
  return map;
}

export async function getAllBriefs(ascending = false) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('briefs')
    .select('id, run_label, run_date, brief_mode, headline, dashboard_states(*)')
    .eq('published', true)
    .order('run_date', { ascending })
    .order('created_at', { ascending });
  return data ?? [];
}

export async function getBriefById(id) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('briefs')
    .select('*, dashboard_states(*), brief_items(*)')
    .eq('published', true)
    .eq('id', id)
    .limit(1);
  return data?.[0] ?? null;
}

// Read order for the claim tracker: still-resolving claims first (unverified,
// then partially verified), settled-negative and commentary next (contradicted,
// opinion), verified last. Verified claims are the majority of rows and the
// least urgent to see first on a mobile scroll, they're receipts, not open
// questions. Ties within a status bucket fall back to most recently updated.
// Sorted client-side after fetch since the priority isn't a real column and
// the table is small (dozens of rows, not thousands).
const CLAIM_STATUS_PRIORITY = {
  unverified: 0,
  partially_verified: 1,
  contradicted: 2,
  opinion: 3,
  verified: 4,
};

export async function getClaims() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('claims')
    .select('*, claim_status_history(*)')
    .order('updated_at', { ascending: false });
  const rows = data ?? [];
  return rows.sort((a, b) => {
    const pa = CLAIM_STATUS_PRIORITY[a.current_status] ?? 99;
    const pb = CLAIM_STATUS_PRIORITY[b.current_status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
}

export async function getWatchItems() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('watch_items')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}
