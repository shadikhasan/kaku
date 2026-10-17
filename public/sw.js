/* Build placeholders are replaced after Next's static export. */
const BUILD = '__BUILD__';
const PRECACHE = [/* __PRECACHE__ */].flat();
const CORE = `kaku-core-${BUILD}`;
const AUDIO = 'kaku-audio-v1';
const AUDIO_URLS = new Set([/* __AUDIO_URLS__ */].flat());

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE);
    try { await cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))); }
    catch (error) { await caches.delete(CORE); throw error; }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const audio = await caches.open(AUDIO);
    for (const key of await caches.keys()) {
      // Preserve previously played audio when upgrading from the original worker.
      if (key.startsWith('kana-studio-')) {
        const old = await caches.open(key);
        for (const request of await old.keys()) {
          if (AUDIO_URLS.has(new URL(request.url).pathname)) {
            const response = await old.match(request);
            if (response?.status === 200 && !(await audio.match(request))) await audio.put(request, response).catch(() => {});
          }
        }
      }
      if ((key.startsWith('kaku-core-') && key !== CORE) || key.startsWith('kana-studio-')) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

function canReload(client) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 3000);
    channel.port1.onmessage = event => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(event.data === true);
    };
    client.postMessage({ type: 'CAN_RELOAD' }, [channel.port2]);
  });
}

self.addEventListener('message', event => {
  if (event.data?.type === 'STATUS') {
    event.ports[0]?.postMessage({ type: 'OFFLINE_READY', build: BUILD });
    return;
  }
  if (event.data?.type !== 'ACTIVATE_UPDATE') return;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const safe = await Promise.all(clients.map(canReload));
    if (safe.every(Boolean)) await self.skipWaiting();
    else event.source?.postMessage({ type: 'UPDATE_BLOCKED' });
  })());
});

async function audioResponse(request, url) {
  let cache;
  try { cache = await caches.open(AUDIO); } catch { /* Playback still works without storage. */ }
  let response = await cache?.match(url.pathname);
  if (!response) {
    const headers = new Headers(request.headers);
    headers.delete('range');
    response = await fetch(new Request(request, { headers }));
    if (response.status === 200 && response.headers.get('content-type')?.includes('audio/')) {
      await cache?.put(url.pathname, response.clone()).catch(() => {});
    }
  }
  const range = request.headers.get('range');
  if (!range || response.status !== 200) return response;
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = match?.[1] ? Number(match[1]) : 0;
  let end = match?.[2] ? Number(match[2]) : bytes.byteLength - 1;
  if (match && !match[1] && match[2]) { start = Math.max(0, bytes.byteLength - end); end = bytes.byteLength - 1; }
  end = Math.min(end, bytes.byteLength - 1);
  if (!match || (!match[1] && !match[2]) || start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
  const headers = new Headers(response.headers);
  headers.delete('transfer-encoding');
  headers.delete('content-encoding');
  headers.delete('connection');
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (AUDIO_URLS.has(url.pathname)) {
    event.respondWith(audioResponse(request, url));
    return;
  }
  event.respondWith((async () => {
    let cache;
    try { cache = await caches.open(CORE); } catch { /* Fall through to network. */ }
    // Exported RSC requests use distinct .txt paths; never return HTML for them.
    let pathname = url.pathname;
    try { pathname = encodeURI(decodeURIComponent(pathname)); } catch { /* Invalid URL escapes cannot match the precache. */ }
    if (request.mode === 'navigate' && !pathname.split('/').pop()?.includes('.')) pathname = `${pathname.replace(/\/$/, '')}/`;
    if (request.headers.get('RSC') === '1' && !pathname.endsWith('.txt')) {
      pathname = `${pathname.replace(/\/$/, '')}/index.txt`;
    }
    const cached = await cache?.match(pathname);
    if (cached) {
      if (request.headers.get('RSC') === '1') {
        const headers = new Headers(cached.headers);
        headers.set('Content-Type', 'text/x-component');
        return new Response(cached.body, { status: cached.status, headers });
      }
      return cached;
    }
    try { return await fetch(request); }
    catch {
      if (request.mode === 'navigate') return (await cache?.match('/offline.html')) || Response.error();
      return Response.error();
    }
  })());
});
