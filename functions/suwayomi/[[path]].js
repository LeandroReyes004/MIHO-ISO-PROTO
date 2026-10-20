// A same-origin bridge to the configured Suwayomi server. The user authenticates
// with Suwayomi; no password is embedded in the frontend or Worker.
export async function onRequest({ request, env, params }) {
  if (!env.SUWAYOMI_URL) return new Response('Configura SUWAYOMI_URL en Cloudflare Pages.', { status: 503 });
  let base;
  try { base = new URL(env.SUWAYOMI_URL); } catch { return new Response('SUWAYOMI_URL no es válida.', { status: 503 }); }
  if (base.protocol !== 'https:' || base.username || base.password) return new Response('SUWAYOMI_URL debe ser una dirección HTTPS sin credenciales.', { status: 503 });
  const incoming = new URL(request.url);
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
  const target = new URL(base.origin);
  target.pathname = '/' + path;
  target.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cookie');
  const response = await fetch(target, { method: request.method, headers, body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body, redirect: 'manual' });
  const out = new Headers(response.headers);
  out.delete('set-cookie');
  out.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, headers: out });
}
