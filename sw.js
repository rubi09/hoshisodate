// ほしそだて Service Worker: アプリ本体はネット優先（更新をすぐ反映）、オフライン時はキャッシュ
const VERSION = 'v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open('shell-' + VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // ネット優先、失敗したらキャッシュ
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open('shell-' + VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // フォントはキャッシュ優先
    e.respondWith(caches.open('fonts-' + VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }))));
  }
});
