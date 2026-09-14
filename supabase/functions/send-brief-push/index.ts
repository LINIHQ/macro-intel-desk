import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const FALLBACK_ORIGIN = 'https://brief.genxkrypto.com';

// Read reliability, added Sept 14, 2026 after a live miss.
//
// What happened: the Run 23 push never reached subscribers. The config read
// below returned a 504 after 11 seconds during a Supabase slowdown, this
// function had no secret to compare against, and it returned 500. Separately,
// pg_net's 5-second default timeout had already hung up on the call. Both were
// real, but only one of them explains the miss: a more patient caller does not
// help a callee that has already been handed a 504.
//
// The failures in that window were transient, seconds apart. A retry is what
// would have carried this through, and it is the same reasoning applied to the
// site's own reads in lib/supabase.js the same day. Deterministic errors, a
// missing column or an RLS refusal, fail fast instead: they fail identically
// every time and retrying only adds load to an instance already struggling.
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error: any): boolean {
  if (!error) return false;
  const code = typeof error?.code === 'string' ? error.code : '';
  if (/^\d{2}[0-9A-Z]{3}$/.test(code)) return false;
  if (code.startsWith('PGRST')) return false;
  return true;
}

// `build` must return a fresh query on each call: Supabase query builders are
// thenable and single use, so a retry has to construct a new one.
async function readWithRetry(what: string, build: () => any) {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let result: any;
    try {
      result = await build();
    } catch (err) {
      result = { data: null, error: err };
    }

    if (!result?.error) return result?.data;

    lastError = result.error;
    console.error(
      what + ' attempt ' + attempt + ' of ' + MAX_ATTEMPTS + ' failed: ' + JSON.stringify(lastError)
    );

    if (!isRetryable(lastError) || attempt === MAX_ATTEMPTS) break;

    const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
    await sleep(delay + Math.random() * delay * 0.5);
  }

  throw new Error(
    what + ' failed after ' + MAX_ATTEMPTS + ' attempts: ' + (lastError?.message || String(lastError))
  );
}

Deno.serve(async (req: Request) => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  console.error('env check: url present=' + Boolean(url) + ' key present=' + Boolean(key));

  const supabase = createClient(url ?? '', key ?? '');

  let config: Array<{ key: string; value: string }>;
  try {
    config = await readWithRetry('desk_config', () =>
      supabase
        .from('desk_config')
        .select('key, value')
        .in('key', ['vapid_public_key', 'vapid_private_key', 'push_webhook_secret'])
    );
  } catch (err: any) {
    console.error('config read failed: ' + (err?.message || String(err)));
    return new Response(JSON.stringify({ error: 'config unavailable' }), { status: 500 });
  }

  if (!config || config.length < 3) {
    console.error('config incomplete: rows=' + (config ? config.length : 'null'));
    return new Response(JSON.stringify({ error: 'config unavailable' }), { status: 500 });
  }

  const cfg: Record<string, string> = Object.fromEntries(config.map((r) => [r.key, r.value]));

  const secret = req.headers.get('x-push-secret');
  if (!secret || secret !== cfg.push_webhook_secret) {
    return new Response('unauthorized', { status: 401 });
  }

  let payload: { headline?: string; dry_run?: boolean } = {};
  try {
    payload = await req.json();
  } catch (_) {
    payload = {};
  }

  // Dry run exercises the whole path, both reads with their retries, the VAPID
  // setup and the per-subscriber loop, and stops immediately before delivery.
  // It exists so this function can be verified after a change without sending a
  // test notification to real subscribers. It sits after the secret check, so it
  // is not an unauthenticated way to enumerate subscription counts.
  const dryRun = payload.dry_run === true;

  const title = 'XRP Macro Intelligence Desk';
  const body =
    typeof payload.headline === 'string' && payload.headline.trim().length > 0
      ? payload.headline.trim()
      : 'A new brief is live.';

  // VAPID subject is a contact identity for push services (FCM, Mozilla push
  // service, etc.), not a click destination. It has no effect on where a
  // notification opens; kept in sync with the canonical domain for
  // consistency only.
  webpush.setVapidDetails(
    'https://xrpmacro.com',
    cfg.vapid_public_key,
    cfg.vapid_private_key
  );

  let subs: Array<any>;
  try {
    subs = await readWithRetry('push_subscriptions', () =>
      supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth, failed_count, origin')
    );
  } catch (err: any) {
    console.error('subs read failed: ' + (err?.message || String(err)));
    return new Response(JSON.stringify({ error: 'subscriptions unavailable' }), { status: 500 });
  }

  let sent = 0;
  let pruned = 0;
  let failed = 0;
  let wouldSend = 0;

  for (const s of subs ?? []) {
    // Route each subscriber back to the domain they actually installed
    // from. Pre-migration rows have no origin recorded and all predate
    // xrpmacro.com's existence, so brief.genxkrypto.com is the correct
    // fallback for every one of them.
    const dest = s.origin || FALLBACK_ORIGIN;
    const message = JSON.stringify({ title, body, url: dest + '/' });

    if (dryRun) {
      wouldSend++;
      continue;
    }

    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        message,
        { TTL: 86400 }
      );
      sent++;
      await supabase
        .from('push_subscriptions')
        .update({ last_success_at: new Date().toISOString(), failed_count: 0 })
        .eq('id', s.id);
    } catch (err: any) {
      const code = err?.statusCode;
      if (code === 404 || code === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', s.id);
        pruned++;
      } else {
        failed++;
        console.error('push send failed status=' + code);
        await supabase
          .from('push_subscriptions')
          .update({ failed_count: (s.failed_count ?? 0) + 1 })
          .eq('id', s.id);
      }
    }
  }

  if (dryRun) {
    return new Response(
      JSON.stringify({ dry_run: true, would_send: wouldSend, title, body }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ sent, pruned, failed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
