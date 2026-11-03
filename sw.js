// ===== Service worker: permite instalar Criminal Dice como app y jugar en local sin internet =====
// Estrategia "primero la red": con internet siempre se descarga la versión más nueva (lo que subes a GitHub se ve al instante)
// y se guarda una copia; sin internet se usa esa copia. Solo guarda archivos del propio juego (Firebase no pasa por aquí).
const CACHE = 'criminal-dice-v5';
const CORE = ['./', 'index.html', 'menu.css', 'menu.js', 'css/game.css', 'manifest.json',
  'js/audio.js', 'js/settings.js', 'js/profile.js', 'js/account.js', 'js/core.js', 'js/market.js', 'js/rpg.js', 'js/exp.js', 'js/maf.js', 'js/pok.js',
  'js/ai.js', 'js/expediente.js', 'js/tutorial.js', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(req, { cache:'no-cache' }).then(res => {      // no-cache: siempre pregunta al servidor si hay versión nueva
    if (res.status === 200 && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }   // 206 (trozos de audio) no se guardan
    return res;
  }).catch(() => caches.match(req, { ignoreSearch:true }).then(r => r || caches.match('index.html'))));
});
