const CACHE = 'mihon-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch('/', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo guardar la aplicación.');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map(match => match[1]);
    await cache.addAll(assets);
    await cache.put('/', response);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/suwayomi')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === 'navigate') {
      try { const response = await fetch(req); if (response.ok) await cache.put('/', response.clone()); return response; }
      catch { return (await cache.match('/')) || Response.error(); }
    }
    try { const response = await fetch(req); if (response.ok && (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest' || url.pathname === '/icon.svg')) await cache.put(req, response.clone()); return response; }
    catch { return (await cache.match(req)) || Response.error(); }
  })());
});
