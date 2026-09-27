const ZONE_ID = '1e163ccfe638c77cc096b81ce0b54e21';
const SITE = 'https://karyamediasouvenir.com';
const MAX_PATHS = 100;

export async function onRequestPost({ request, env }) {
  const headers = { 'Cache-Control': 'no-store' };

  const key = request.headers.get('x-api-key');
  if (!env.PURGE_SECRET || key !== env.PURGE_SECRET) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401, headers });
  }
  if (!env.CF_API_TOKEN) {
    return Response.json({ ok: false, reason: 'env-missing: CF_API_TOKEN' }, { status: 503, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid-json' }, { status: 400, headers });
  }

  const all = body.all === true;
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p) => typeof p === 'string' && p.length > 0 && p.length < 500).slice(0, MAX_PATHS)
    : [];
  if (!all && paths.length === 0) {
    return Response.json({ ok: false, error: 'paths-required' }, { status: 400, headers });
  }

  const urls = all
    ? null
    : paths.map((p) => (p.startsWith('http') ? p : SITE + (p.startsWith('/') ? p : '/' + p)));

  const purgeRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.CF_API_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(all ? { purge_everything: true } : { files: urls }),
    }
  );
  const purgeData = await purgeRes.json().catch(() => null);

  let revalidate = null;
  const rvType = typeof body.revalidate === 'string' ? body.revalidate : null;
  if (rvType && env.REVALIDATION_SECRET) {
    try {
      const rv = await fetch(SITE + '/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.REVALIDATION_SECRET, type: rvType }),
      });
      revalidate = await rv.json().catch(() => null);
    } catch (e) {
      revalidate = { error: String(e) };
    }
  }

  return Response.json(
    {
      ok: !!(purgeData && purgeData.success),
      purged: all ? 'everything' : urls.length,
      errors: purgeData && purgeData.success ? undefined : (purgeData && purgeData.errors) || 'purge-failed',
      revalidate,
      now: Date.now(),
    },
    { headers }
  );
}

export async function onRequestGet() {
  return Response.json(
    { ok: false, error: 'use POST' },
    { status: 405, headers: { 'Cache-Control': 'no-store', Allow: 'POST' } }
  );
}
