// 비행기 모드(오프라인)에서도 앱이 열리게 하는 서비스워커 — 오프라인에서는 보기 전용.
// - 화면(HTML)·일정(/api/trip): 인터넷이 되면 항상 새로 받고, 안 되면 마지막으로 받은 것을 보여 준다
// - /_next/static (빌드마다 이름이 바뀌는 파일): 한 번 받으면 캐시에서
// - 사진: 캐시에 있으면 캐시에서 (홈의 '오프라인 저장'이 미리 받아 둔다 — components/OfflineSave.tsx 와 캐시 이름이 같아야 함)
const SHELL = "nt-shell-v1";
const STATIC = "nt-static-v1";
const IMG = "nt-img-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    // 로그인으로 넘기는 응답(리다이렉트)은 저장하지 않는다
    if (res.ok && !res.redirected) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = (await cache.match(request, { ignoreSearch: true })) || (fallbackUrl ? await cache.match(fallbackUrl) : undefined);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  // 다른 사이트 사진은 내용을 볼 수 없는(opaque) 응답으로 오지만 저장·표시는 된다
  if (res.ok || res.type === "opaque") cache.put(request, res.clone()).catch(() => {});
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (url.origin !== self.location.origin) {
    // 지도 타일·구글 자원은 저장하지 않는다 (양이 많고 오프라인에서 지도는 못 씀)
    if (/tile|openstreetmap|google|gstatic/.test(url.hostname)) return;
    if (req.destination === "image") event.respondWith(cacheFirst(req, IMG));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC));
  } else if (url.pathname === "/api/trip") {
    event.respondWith(networkFirst(req, SHELL));
  } else if (url.pathname.startsWith("/api/")) {
    // AI 질문·로그인은 인터넷이 있어야 한다
  } else if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, SHELL, "/"));
  } else if (req.destination === "image" || url.pathname === "/manifest.webmanifest") {
    event.respondWith(networkFirst(req, STATIC));
  }
});
