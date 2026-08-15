const CACHE = "akigusa-school-v13";
const LIVE_DATA = new Set(["learning.json", "content-library.json", "scenic.json"]);
const CORE = [
  "./", "manifest.webmanifest", "learning.json", "content-library.json", "scenic.json",
  "aki-hero.webp", "aki-hero-sunflower.webp", "aki-hero-sakura.webp",
  "aki-hero-hydrangea.webp", "aki-hero-cosmos.webp",
  "aki-hero-camellia-red-panda.webp", "panda-study-flowers.webp",
  "rabbit-kana-practice.webp", "fluffy-alpaca-level.webp",
  "red-panda-review-flower.webp", "sea-otter-radio.webp",
  "owl-listening.webp", "squirrel-flower-rewards.webp",
  "cat-reward.webp", "cats-study-cards.webp", "aki-kana-practice.webp",
  "black-cat-hide.webp", "white-cat-peek.webp", "black-cat-daruma.webp",
  "sakura-sprig.webp", "wisteria-hang.webp", "autumn-flower-grass.webp",
  "flower-ume-snow.webp", "flower-morning-glory.webp",
  "flower-hydrangea.webp", "flower-sunflower.webp",
  "flower-hanashobu.webp", "flower-kiku-wreath.webp",
  "flower-nanohana.webp", "flower-suisen.webp",
  "stroke-order-license.txt", "stroke-order-hiragana.json", "stroke-order-katakana.json",
];

const scopedUrl = (path) => new URL(path, self.registration.scope).href;

self.addEventListener("install", (event) => {
  const freshCore = CORE.map((path) => new Request(scopedUrl(path), { cache: "reload" }));
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
  const scopePath = new URL("./", self.registration.scope).pathname;
  if (url.pathname.startsWith(`${scopePath}api/`)) return;
  const fileName = url.pathname.split("/").pop() ?? "";
  if (LIVE_DATA.has(fileName)) {
    const canonicalRequest = new Request(scopedUrl(fileName));
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
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(scopedUrl("./"))))
  );
});
