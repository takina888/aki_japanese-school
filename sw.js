const RELEASE = "V015.38";
const CACHE_PREFIXES = ["akigusa-school-", "akigusa-school:"];
const CACHE = "akigusa-school-v58";

const LIVE_DATA = new Set([
  "learning.json", "content-library.json", "life-kanji.json", "scenic.json",
  "quick-words.json", "praise.json", "life-advice.json", "release.json",
]);

const GENERATED_SHELL = [
  "framework-CXnKph_e.js", "index-v01538-cachefix-c1ee8173.js", "index-v01519-bafd2b6b.css",
  "layout-segment-context-v01519-08407bf6.js", "page-v01519-39e9f80a.css",
  "page-v01538-cachefix-c83ea288.js", "rolldown-runtime-S-ySWqyJ.js",
];
const GENERATED_SHELL_FILES = new Set(GENERATED_SHELL);

const CORE = [
  "./", "manifest.webmanifest", "learning.json", "content-library.json", "life-kanji.json", "scenic.json",
  "quick-words.json", "praise.json", "life-advice.json", "release.json",
  "akigusa-enhancements-v01538.js", "akigusa-enhancements-v01538.css",
  "aki-hero.webp", "aki-hero-sunflower.webp", "aki-hero-sakura.webp",
  "aki-hero-hydrangea.webp", "aki-hero-cosmos.webp",
  "aki-hero-camellia-red-panda.webp", "aki-hero-camellia-red-panda-mobile.webp",
  "panda-study-flowers.webp", "aki-hero-fuji-travel.webp",
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
  ...GENERATED_SHELL,
];

const scopedUrl = (path) => new URL(path, self.registration.scope).href;
const scopePath = new URL("./", self.registration.scope).pathname;
const isOwnedCache = (name) => CACHE_PREFIXES.some((prefix) => name.startsWith(prefix));
const fileNameOf = (url) => url.pathname.split("/").pop() || "";
function canonicalRequest(urlOrPath) {
  const url = typeof urlOrPath === "string" ? new URL(urlOrPath, self.registration.scope) : urlOrPath;
  return new Request(`${url.origin}${url.pathname}`);
}
async function matchCurrent(request) { return (await caches.open(CACHE)).match(request); }
async function storeResponse(request, response) {
  if (response?.ok) await (await caches.open(CACHE)).put(request, response.clone());
}
async function networkFirst(request, canonical, fallback) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    await storeResponse(canonical, response); return response;
  } catch {
    return (await matchCurrent(canonical)) || (fallback ? await matchCurrent(fallback) : undefined) || Response.error();
  }
}
async function cacheFirst(request, canonical) {
  const cached = await matchCurrent(canonical); if (cached) return cached;
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    await storeResponse(canonical, response); return response;
  } catch { return Response.error(); }
}
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map((path) => new Request(scopedUrl(path), { cache: "reload" })));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => isOwnedCache(key) && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    windows.forEach((client) => client.postMessage({ type: "AKIGUSA_VERSION_READY", release: RELEASE, cache: CACHE }));
  })());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
  if (event.data?.type === "GET_VERSION") event.ports?.[0]?.postMessage({ release: RELEASE, cache: CACHE });
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(scopePath) || url.pathname.startsWith(`${scopePath}api/`)) return;
  const fileName = fileNameOf(url);
  if (fileName === "reset.html" || fileName === "sw.js") return;
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, canonicalRequest(scopedUrl("./")))); return;
  }
  if (LIVE_DATA.has(fileName) || fileName === "manifest.webmanifest") {
    event.respondWith(networkFirst(event.request, canonicalRequest(scopedUrl(fileName)))); return;
  }
  const canonical = canonicalRequest(url);
  event.respondWith(cacheFirst(event.request, canonical));
});
