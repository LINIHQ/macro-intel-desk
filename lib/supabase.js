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

// Level history per category across all published runs, oldest first.
// Returns { [category]: [level, level, ...] } for dashboard sparklines.
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
      map[s.category].push(s.level);
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
    .order('run_date', { ascending });
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

export async function getClaims() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('claims')
    .select('*, claim_status_history(*)')
    .order('updated_at', { ascending: false });
  return data ?? [];
}

export async function getWatchItems() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('watch_items')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}
