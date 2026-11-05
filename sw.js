/**
 * Service worker do Nebula Titan (PWA): permite instalar e jogar OFFLINE.
 *
 * Estratégia "rede primeiro, cache como reserva":
 *  - online: sempre busca a versão mais nova (deploys da Vercel aparecem na hora)
 *    e guarda uma cópia no cache;
 *  - offline: responde com a cópia do cache.
 * Na instalação, já guarda os arquivos essenciais para a 1ª visita offline.
 * Trocar CACHE_VERSION descarta caches antigos.
 */
const CACHE_VERSION = 'nebula-titan-v1.6.1';
const CORE = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/sprites/manifest.json',
  './src/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Só o próprio jogo e a fonte do Google Fonts entram no cache.
  const cacheable = url.origin === self.location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!cacheable) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit ?? caches.match('./index.html'))),
  );
});
