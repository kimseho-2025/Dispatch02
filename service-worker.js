// Service Worker for 성우 배차 관리 시스템
const CACHE_NAME = 'dispatch-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap'
];

// Install event - 캐시에 파일 저장
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - 캐시 우선 전략 (Cache First, falling back to network)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시 반환
        if (response) {
          return response;
        }

        // 캐시에 없으면 네트워크 요청
        return fetch(event.request).then((response) => {
          // 유효한 응답인지 확인
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답을 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // 네트워크 실패 시 오프라인 페이지 반환 (선택사항)
          return new Response('오프라인 상태입니다. 인터넷 연결을 확인해주세요.', {
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
          });
        });
      })
  );
});

// Background Sync (선택사항)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync');
    event.waitUntil(
      // 백그라운드에서 데이터 동기화 로직
      Promise.resolve()
    );
  }
});

// Push Notification (선택사항)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 배차 알림',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('성우 배차', options)
  );
});
