// const addResourcesToCache = async (resources) => {
//   const cache = await caches.open("v1");
//   await cache.addAll(resources);
// };

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});