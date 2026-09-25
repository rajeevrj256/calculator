// Minimal service worker so browsers treat Reel Studio as an installable app.
// Everything is served live from your computer; nothing is cached offline.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
