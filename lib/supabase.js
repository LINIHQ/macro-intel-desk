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
