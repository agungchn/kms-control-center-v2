import { onRequestPost as purgePost } from './functions/api/purge.js';
import { onRequestGet as stateGet } from './functions/api/state.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/purge') {
      if (request.method === 'POST') return purgePost({ request, env });
      return Response.json({ ok: false, error: 'use POST' }, { status: 405 });
    }

    if (pathname === '/api/state') {
      if (request.method === 'GET') return stateGet({ env });
      return Response.json({ ok: false, error: 'use GET' }, { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
