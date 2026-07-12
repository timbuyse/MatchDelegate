// Afgeleid van de ?v=APP_VERSION querystring waarmee index.html dit script registreert
// (B16: één versiebron i.p.v. dit getal apart handmatig bijhouden naast APP_VERSION).
const CACHE = 'voetbal-v' + (new URL(location.href).searchParams.get('v') || 'dev');
const ASSETS = ['./', './index.html', './manifest.json', './MD_cropped.png', './logo_no_background.png', './logo.png', './background_logo.jpg',
  './firebase/firebase-app-compat.js', './firebase/firebase-auth-compat.js', './firebase/firebase-database-compat.js',
  './js/core.js', './js/views-account.js', './js/stats-settings.js', './js/teams-tournaments.js',
  './js/wizard-prep.js', './js/live-match.js', './js/detail-pdf.js',
  './pdf/jspdf.umd.min.js', './pdf/jspdf.plugin.autotable.min.js'];

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
    // Bij "lie-fi" (zwakke, wispelturige verbinding) kan fetch() tientallen seconden
    // hangen vóór hij zelf faalt — de gebruiker staart dan al die tijd naar de splash.
    // Race tegen een korte timeout en val dan terug op de cache; de echte fetch loopt
    // op de achtergrond door en ververst de cache zodra hij (eventueel later) aankomt.
    const network = fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return res;
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('sw-timeout')), 3000));
    e.respondWith(
      Promise.race([network, timeout]).catch(() =>
        caches.match(req).then(c => c || caches.match('./index.html')).then(cached => cached || network)
      )
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
