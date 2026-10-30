const CACHE_NAME = 'pokopia-cache-v4.24.0';

const STATIC_ASSETS = [
  './',
  './index.html',
  './index.css?v=4.24.0',
  './data.js?v=4.15.0',
  './preferences_db.js?v=4.15.0',
  './autofarm_data.js?v=4.15.0',
  './region_data.js?v=4.15.0',
  './video_data.js?v=4.15.0',
  './firebase.js?v=4.15.0',
  './buzz_voxel_data.js?v=4.24.0',
  './bulbasaur_voxel_data.js?v=4.24.0',
  './venusaur_voxel_data.js?v=4.24.0',
  './app.js?v=4.24.0',
  './manifest.json',
  './assets/logo.png?v=4.24.0',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

// 安裝 Service Worker：預先快取核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 啟動 Service Worker：清理過期舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 攔截請求：網路優先 (Network-First)，離線時無縫回退至本地快取
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 僅處理 GET 請求
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 外部雲端 API 與動態串流（Firebase、Firestore、YouTube 等）走純網路
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') && url.pathname.includes('firestore') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('youtube-nocookie.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // 成功連線：若為有效回應則同步更新進快取
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(async () => {
        // 網路中斷 (離線模式)：從本地快取讀取
        const cachedRes = await caches.match(req);
        if (cachedRes) return cachedRes;

        // 若為頁面導航且無個別快取，回傳首頁 index.html
        if (req.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }

        return new Response('Offline resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable (Offline)'
        });
      })
  );
});
