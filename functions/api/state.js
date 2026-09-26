const AIRTABLE = 'https://api.airtable.com/v0/';

async function table(base, token, name, max) {
  try {
    const r = await fetch(AIRTABLE + base + '/' + name + '?maxRecords=' + max, {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.records || []).map((x) => Object.assign({ recordId: x.id }, x.fields || {}));
  } catch (e) {
    return [];
  }
}

export async function onRequestGet({ env }) {
  const token = env.AIRTABLE_TOKEN;
  const base = env.AIRTABLE_BASE_ID;
  if (!token || !base) {
    return Response.json(
      { ok: false, reason: 'env-missing', now: Date.now() },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const [agents, tasks, messages, comms] = await Promise.all([
    table(base, token, 'Agents', 50),
    table(base, token, 'Tasks', 100),
    table(base, token, 'AgentMessages', 50),
    table(base, token, 'Communications', 50),
  ]);
  return Response.json(
    { ok: true, now: Date.now(), agents, tasks, messages, comms },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
