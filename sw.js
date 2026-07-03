const CACHE = 'voetbal-v34';
const ASSETS = ['./', './index.html', './manifest.json', './MD_cropped.png', './logo_no_background.png', './background_logo.jpg', './fonts/tabler-icons.min.css', './fonts/tabler-icons.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Externe verzoeken (Firebase SDK, realtime database) niet onderscheppen/cachen.
  if (url.origin !== location.origin) return;
  const isDoc = req.mode === 'navigate' || req.destination === 'document' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isDoc) {
    // Pagina/app-shell: netwerk-eerst zodat nieuwe versies meteen verschijnen.
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Overige bestanden: cache-eerst, maar op de achtergrond verversen (stale-while-revalidate).
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
