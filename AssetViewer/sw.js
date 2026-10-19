// Service worker: makes Focus List open instantly and work offline.
// - Pages, scripts and styles: network first (you always get the newest version when
//   online), falling back to the cached copy when offline.
// - Images and icons: cache first.
// - Video/audio and other sites (Supabase, CDN) are never touched.
// Bump VERSION when you deploy changes to the files listed in SHELL.
const VERSION = 'fl-v3';
const SHELL = [
  './',
  'index.html',
  'habit-tracker.html',
  'day-planner.html',
  'calendar.html',
  'matrix.html',
  'goal-countdown.html',
  'motivation.html',
  'ambience.html',
  'styles.css',
  'app-shell.css',
  'app.js',
  'calendar.js',
  'matrix.js',
  'motivation.js',
  'theme.js',
  'header.js',
  'nav.js',
  'sync.js',
  'supabase-config.js',
  'ambience-engine.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/optimized/focus-bg-poster.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(mp4|mp3|webm|m4a|wav)$/i.test(url.pathname) || req.headers.has('range')) return;

  if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    if (req.mode === 'navigate') {
      const home = await cache.match('index.html');
      if (home) return home;
    }
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') cache.put(req, res.clone());
  return res;
}
