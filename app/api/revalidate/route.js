import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// On-demand revalidation for the routes whose content only changes at publish.
//
// Added Sept 14, 2026. Before this, every content route ran on a timer:
// claims and watch at 300s, the rest at 60s. Supabase request logs for a
// single 24-hour window showed 199 claims regenerations, 201 watch, 421
// gauge_criteria and 1,034 briefs, against content that changes once a day
// when a brief is published. Essentially all of that compute produced a
// byte-identical page, and the same storm saturated the Supabase connection
// pool: on Sept 14 the REST layer returned 502 and 504 across every table for
// roughly sixteen minutes, the claims page cached an empty render, and the
// brief push notification failed outright.
//
// The routes now carry a long backstop revalidate and are purged from here
// the moment a brief flips to published.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Every route that reads published brief content. The live page is included
// because a publish changes it too; it keeps its own short timer as well,
// since it is the one page where freshness is worth the rebuild.
const PATHS = [
  '/',
  '/claims',
  '/watch',
  '/archive',
  '/history',
  '/methodology',
  '/sources',
];

function unauthorized() {
  // Deliberately identical response for a missing and a wrong secret, so this
  // endpoint cannot be used to probe whether a secret is configured.
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function POST(request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return unauthorized();

  const provided = request.headers.get('x-revalidate-secret');
  if (!provided || provided !== expected) return unauthorized();

  const revalidated = [];
  const failed = [];

  for (const path of PATHS) {
    try {
      revalidatePath(path);
      revalidated.push(path);
    } catch (err) {
      // One bad path must not abort the rest. A partial purge still beats a
      // total miss, and the caller gets told exactly which paths were left.
      failed.push({ path, error: String(err?.message || err) });
    }
  }

  // Brief permalinks are a dynamic segment. Purging the segment covers the
  // brief that just published along with any earlier one whose record changed
  // in the same run, which is common: a corrected verdict or a swept pending
  // reference touches an archived brief, not only today's.
  try {
    revalidatePath('/brief/[id]', 'page');
    revalidated.push('/brief/[id]');
  } catch (err) {
    failed.push({ path: '/brief/[id]', error: String(err?.message || err) });
  }

  return NextResponse.json({
    ok: failed.length === 0,
    revalidated,
    failed,
    at: new Date().toISOString(),
  });
}

// Explicitly reject anything else. A GET here would be trivially triggerable
// by a crawler or a link preview, which is the opposite of the point.
export async function GET() {
  return NextResponse.json({ ok: false, error: 'method not allowed' }, { status: 405 });
}
