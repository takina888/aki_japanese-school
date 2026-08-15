const RELEASE = "V015";
const CACHE_PREFIXES = ["akigusa-school-", "akigusa-school:"];
const CACHE = "akigusa-school-v21";
const PREVIOUS_CACHE = "akigusa-school-v20";
const RETAINED_CACHES = new Set([CACHE, PREVIOUS_CACHE]);

const LIVE_DATA = new Set([
  "learning.json",
  "content-library.json",
  "life-kanji.json",
  "scenic.json",
  "quick-words.json",
  "praise.json",
  "life-advice.json",
  "release.json",
]);

// The flat GitHub Pages builder replaces this marker with the content-hashed
// JavaScript and CSS filenames emitted by Vite. Their immutable names make a
// cache-first strategy safe without allowing an old HTML document to linger.
const GENERATED_SHELL = ["framework-CXnKph_e.js", "index-CclfYWuZ.css", "index-CrSEnUKH.js", "layout-segment-context-CYo6tYD1.js", "page-BZpJIqrL.css", "page-BpU9oKGt.js", "rolldown-runtime-S-ySWqyJ.js"];
const GENERATED_SHELL_FILES = new Set(GENERATED_SHELL);

const CORE = [
  "./", "manifest.webmanifest", "learning.json", "content-library.json", "life-kanji.json", "scenic.json",
  "quick-words.json", "praise.json", "life-advice.json", "release.json",
  "aki-hero.webp", "aki-hero-sunflower.webp", "aki-hero-sakura.webp",
  "aki-hero-hydrangea.webp", "aki-hero-cosmos.webp",
  "aki-hero-camellia-red-panda.webp", "aki-hero-camellia-red-panda-mobile.webp",
  "panda-study-flowers.webp",
  "aki-hero-fuji-travel.webp",
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

async function matchRetainedCaches(request) {
  for (const name of [CACHE, PREVIOUS_CACHE]) {
    if (!(await caches.has(name))) continue;
    const cached = await (await caches.open(name)).match(request);
    if (cached) return cached;
  }
  return undefined;
}

async function storeResponse(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
}

async function networkFirst(request, canonical, fallback) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (!response.ok) throw new Error(`Network request failed: ${response.status}`);
    await storeResponse(canonical, response);
    return response;
  } catch {
    return (await matchRetainedCaches(canonical)) || (fallback ? await matchRetainedCaches(fallback) : undefined) || Response.error();
  }
}

async function cacheFirst(request, canonical) {
  const cached = await matchRetainedCaches(canonical);
  if (cached) return cached;
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (!response.ok) throw new Error(`Immutable asset request failed: ${response.status}`);
    await storeResponse(canonical, response);
    return response;
  } catch {
    return Response.error();
  }
}

async function refreshLegacyWindows(hadOlderAppCache) {
  if (!hadOlderAppCache) return;
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.allSettled(windows.map(async (client) => {
    const target = new URL(client.url);
    if (target.origin !== self.location.origin || !target.pathname.startsWith(scopePath) || target.pathname.endsWith("reset.html")) return;
    target.searchParams.set("aki-update", RELEASE);
    target.searchParams.set("open", String(Date.now()));
    await client.navigate(target.href);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const freshCore = CORE.map((path) => new Request(scopedUrl(path), { cache: "reload" }));
    await cache.addAll(freshCore);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const hadOlderAppCache = keys.some((key) => isOwnedCache(key) && key !== CACHE);
    await Promise.all(keys
      .filter((key) => isOwnedCache(key) && !RETAINED_CACHES.has(key))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
    await refreshLegacyWindows(hadOlderAppCache);
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data?.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({ release: RELEASE, cache: CACHE });
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(scopePath) || url.pathname.startsWith(`${scopePath}api/`)) return;

  const fileName = fileNameOf(url);
  // reset.html must always be handled by the browser/network. It is the
  // one-time recovery route and must never depend on the cache it repairs.
  if (fileName === "reset.html") return;

  if (event.request.mode === "navigate") {
    const appShell = canonicalRequest(scopedUrl("./"));
    event.respondWith(networkFirst(event.request, appShell));
    return;
  }

  if (LIVE_DATA.has(fileName)) {
    const canonical = canonicalRequest(scopedUrl(fileName));
    event.respondWith(networkFirst(event.request, canonical));
    return;
  }

  const canonical = canonicalRequest(url);
  if (GENERATED_SHELL_FILES.has(fileName)) {
    event.respondWith(cacheFirst(event.request, canonical));
    return;
  }

  // Fixed-name illustrations, the manifest and stroke data are refreshed from
  // the network so replacing V011/V013 files in place cannot leave stale art.
  // Offline fallback is exact-path only; non-navigation requests never receive
  // index.html as an accidental response.
  event.respondWith(networkFirst(event.request, canonical));
});
