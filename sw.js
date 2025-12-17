// Service Worker معدل ليعمل مع GitHub Pages
const APP_NAME = 'مصفوفة أيزنهاور';
const CACHE_NAME = 'eisenhower-matrix-v1.0.1';
const REPO_NAME = '/eisenhower-matrix-pwa/'; // اسم المستودع

// دالة لإرجاع المسار الصحيح
function getCacheUrl(url) {
    // إذا كان المسار يبدأ بـ REPO_NAME، اتركه كما هو
    if (url.startsWith(REPO_NAME)) {
        return url;
    }
    // إذا كان المسار يبدأ بـ /، أضف REPO_NAME
    if (url.startsWith('/')) {
        return REPO_NAME + url.substring(1);
    }
    // إذا كان مسار نسبي، أضف REPO_NAME
    return REPO_NAME + url;
}

// الملفات التي سيتم تخزينها في الكاش (باستخدام المسارات المطلقة)
const FILES_TO_CACHE = [
    '/eisenhower-matrix-pwa/',
    '/eisenhower-matrix-pwa/index.html',
    '/eisenhower-matrix-pwa/css/style.css',
    '/eisenhower-matrix-pwa/js/app.js',
    '/eisenhower-matrix-pwa/js/db.js',
    '/eisenhower-matrix-pwa/manifest.json',
    '/eisenhower-matrix-pwa/icons/icon-72x72.png',
    '/eisenhower-matrix-pwa/icons/icon-96x96.png',
    '/eisenhower-matrix-pwa/icons/icon-128x128.png',
    '/eisenhower-matrix-pwa/icons/icon-144x144.png',
    '/eisenhower-matrix-pwa/icons/icon-512x512.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Install completed');
                return self.skipWaiting();
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activation completed');
            return self.clients.claim();
        })
    );
});

// التعامل مع الطلبات
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    
    // تجاهل طلبات غير HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا وجدنا الملف في الكاش
                if (response) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }
                
                // إذا لم نجده، نجلب من الشبكة
                console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // تحقق مما إذا كان الرد صالحًا للتخزين
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // استنساخ الرد للتخزين
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // فقط خزن الملفات من نطاقنا
                                if (requestUrl.origin === self.location.origin) {
                                    cache.put(event.request, responseToCache);
                                    console.log('[Service Worker] Caching new resource:', event.request.url);
                                }
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Fetch failed:', error);
                        
                        // إذا كان الطلب للصفحة الرئيسية
                        if (event.request.mode === 'navigate') {
                            return caches.match('/eisenhower-matrix-pwa/index.html');
                        }
                        
                        // للطلبات الأخرى، يمكن إرجاع صفحة بديلة
                        return new Response('التطبيق غير متصل بالإنترنت', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/html; charset=utf-8'
                            })
                        });
                    });
            })
    );
});

// استقبال الرسائل من التطبيق
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
