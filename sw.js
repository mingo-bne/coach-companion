// Coach Companion service worker (ADR-012). Holds the app shell ONLY — never a pack, never
// fixtures, never anything a coach loads (those live in localStorage on the phone).
// Network-first: online, a coach always gets the latest app; offline, the cached copy.
// Bump CACHE when the shell list changes; the app itself refreshes on every online open.
const CACHE = 'cc-shell-1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r, {ignoreSearch: true})
      .then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : undefined))
      .then(m => m || Response.error()))
  );
});
