import { getFeedBriefs } from '@/lib/supabase';

// RSS 2.0 feed of published briefs, added Sept 24, 2026. Gives readers a path
// to the desk that does not run through Discord or X. One item per published
// brief, newest first, linking to the brief's permalink. The item body is the
// run's teaser (the same three-signal card Discord shows) when the run wrote
// one, else the headline; the full brief stays on the site, where its receipts
// are. Plain text only: the feed never carries markdown, status emoji as a
// scale, run labels, or the collection tool's name, the same rules as every
// other public surface.
export const revalidate = 300;

const BASE = 'https://xrpmacro.com';
const TITLE = 'XRP Macro Intelligence Desk';
const DESCRIPTION = 'Verified XRP and macro briefs, published with sourced receipts.';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rfc822(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toUTCString();
}

function fmtRunDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00Z');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function itemTitle(b) {
  const mode = b.brief_mode === 'full' ? 'Full brief' : 'Quick brief';
  return `${mode}, ${fmtRunDate(b.run_date)}`;
}

export async function GET() {
  const briefs = await getFeedBriefs(30);
  const newest = briefs[0];
  const lastBuild = newest ? rfc822(newest.last_updated_at || newest.published_at || newest.created_at) : '';

  const items = briefs
    .map((b) => {
      const link = `${BASE}/brief/${b.id}`;
      const pub = rfc822(b.published_at || b.created_at);
      const body = (b.teaser_md || b.headline || '').trim();
      return [
        '    <item>',
        `      <title>${esc(itemTitle(b))}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        pub ? `      <pubDate>${pub}</pubDate>` : '',
        `      <description>${esc(body)}</description>`,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${esc(TITLE)}</title>`,
    `    <link>${BASE}/</link>`,
    `    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml" />`,
    `    <description>${esc(DESCRIPTION)}</description>`,
    '    <language>en-us</language>',
    lastBuild ? `    <lastBuildDate>${lastBuild}</lastBuildDate>` : '',
    items,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
