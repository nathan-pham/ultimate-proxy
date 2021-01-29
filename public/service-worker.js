const PRECACHE = "precache-v1"
const RUNTIME = "runtime"

const PRECACHE_URLS = [
	"/",
	"/css/globals.css",
	"/css/index.css",
	"/js/app.js"
]

self.addEventListener("install", e => {
	e.waitUntil(
		caches.open(PRECACHE)
			.then(cache => cache.addAll(PRECACHE_URLS))
			.then(self.skipWaiting())
	)
})

self.addEventListener("activiate", e => {
	const currentCaches = [ PRECACHE, RUNTIME ]
	e.waitUntil(
		caches.keys()
			.then(cacheNames => {
				return cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
			})
			.then(deleteQueue => {
				return Promise.all(deleteQueue.map(toDelete => {
					return caches.delete(toDelete)
				}))
			})
			.then(() => self.clients.claim())
	)
})

self.addEventListener("fetch", e => {
	if(e.request.url.startsWith(self.location.origin)) {
		e.respondWith(
			caches.match(e.request)
				.then(cachedResponse => {
					if(cachedResponse) {
						return cachedResponse
					}

					return caches.open(RUNTIME).then(cache => {
						return fetch(e.request).then(response => {
							return cache.put(e.request, response.clone()).then(() => {
								return response
							})
						})
					})
				})
		)
	}
})