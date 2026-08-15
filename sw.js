const CACHE = "akigusa-school-v11";
const LIVE_DATA = new Set(["/learning.json", "/content-library.json", "/scenic.json"]);
const CORE = [
  "/", "/manifest.webmanifest", "/learning.json", "/content-library.json", "/scenic.json",
  "/assets/aki-hero.webp", "/assets/aki-hero-sunflower.webp", "/assets/aki-hero-sakura.webp",
  "/assets/aki-hero-hydrangea.webp", "/assets/aki-hero-cosmos.webp",
  "/assets/aki-hero-camellia-red-panda.webp", "/assets/panda-study-flowers.webp",
  "/assets/rabbit-kana-practice.webp", "/assets/fluffy-alpaca-level.webp",
  "/assets/red-panda-review-flower.webp", "/assets/sea-otter-radio.webp",
  "/assets/owl-listening.webp", "/assets/squirrel-flower-rewards.webp",
  "/assets/cat-reward.webp", "/assets/cats-study-cards.webp", "/assets/aki-kana-practice.webp",
  "/assets/black-cat-hide.webp", "/assets/white-cat-peek.webp", "/assets/black-cat-daruma.webp",
  "/assets/sakura-sprig.webp", "/assets/wisteria-hang.webp", "/assets/autumn-flower-grass.webp",
  "/assets/flower-ume-snow.webp", "/assets/flower-morning-glory.webp",
  "/assets/flower-hydrangea.webp", "/assets/flower-sunflower.webp",
  "/assets/flower-hanashobu.webp", "/assets/flower-kiku-wreath.webp",
  "/assets/flower-nanohana.webp", "/assets/flower-suisen.webp",
  "/stroke-order/LICENSE.txt", "/stroke-order/hiragana.json", "/stroke-order/katakana.json",
];

self.addEventListener("install", (event) => {
  const freshCore = CORE.map((path) => new Request(path, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(freshCore)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (LIVE_DATA.has(url.pathname)) {
    const canonicalRequest = new Request(`${url.origin}${url.pathname}`);
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Fresh data request failed: ${response.status}`);
          const copy = response.clone();
          const cache = await caches.open(CACHE);
          await cache.put(canonicalRequest, copy);
          return response;
        })
        .catch(() => caches.match(canonicalRequest).then((cached) => cached || Response.error()))
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
