// 드론 시티 월드투어 — 서비스워커
// 앱 셸(HTML/CSS/JS/아이콘)은 캐시 우선, 지도 타일은 항상 네트워크
const CACHE = 'drone-city-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // 지도 타일·위성 영상은 캐시하지 않고 네트워크 직행 (용량 폭증 방지)
  if (/arcgisonline\.com|openfreemap\.org/.test(url)) return;
  // HTML(앱 본체)·매니페스트는 네트워크 우선 — 업데이트가 즉시 반영되고, 오프라인이면 캐시 사용
  if (e.request.mode === 'navigate' || /index\.html|manifest\.webmanifest/.test(url)) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // 그 외 정적 자원(라이브러리·아이콘)은 캐시 우선
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
