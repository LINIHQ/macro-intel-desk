import { getFeedBriefs } from '@/lib/supabase';

// Sept 24, 2026. The site had no sitemap; search was already the second
// referrer after X, so this is the cheapest way to make every permalink
// discoverable. Static pages first, then one entry per published brief.
// /card is excluded on purpose: it is the desk's private pre-drop utility and
// carries robots noindex of its own.
export const revalidate = 3600;

const BASE = 'https://xrpmacro.com';

const STATIC = [
  ['/', 'hourly', 1.0],
  ['/archive', 'daily', 0.8],
  ['/claims', 'daily', 0.8],
  ['/watch', 'daily', 0.7],
  ['/history', 'daily', 0.6],
  ['/methodology', 'weekly', 0.6],
  ['/sources', 'weekly', 0.5],
  ['/install', 'monthly', 0.3],
  ['/privacy', 'yearly', 0.1],
  ['/terms', 'yearly', 0.1],
];

export default async function sitemap() {
  const briefs = await getFeedBriefs(1000);
  const pages = STATIC.map(([path, changeFrequency, priority]) => ({
    url: `${BASE}${path}`,
    changeFrequency,
    priority,
  }));
  const permalinks = briefs.map((b) => ({
    url: `${BASE}/brief/${b.id}`,
    lastModified: b.last_updated_at || b.published_at || b.created_at || undefined,
    changeFrequency: 'never',
    priority: 0.5,
  }));
  return [...pages, ...permalinks];
}
