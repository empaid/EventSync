const CACHE_NAME = 'asset-cache-v1';

async function cacheSaveFromURL(url, name, onProgress) {
  const cache = await caches.open(CACHE_NAME);
  const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });

  if (!resp.ok || !resp.body) throw new Error(`fetch failed: ${resp.status}`);

  const total = Number(resp.headers.get('Content-Length') || 0);
  const blob = await resp.blob();

  if (onProgress && total) onProgress(100);

  await cache.put(name, new Response(blob));
}

async function cacheGetBlobURL(name) {
  const cache = await caches.open(CACHE_NAME);
  const matchedResponse = await cache.match(name);
  if (matchedResponse) {
    const file = await matchedResponse.blob();
    return URL.createObjectURL(file);
  }
  return null;
}

const assetBlobUrlById = new Map();

async function cacheOneAsset(asset) {
  const filename = `${asset.id}${getExt(asset.name)}`;
  if (!(await cacheHasFile(filename))) {
    console.log('Cache API downloading', asset.name);
    await cacheSaveFromURL(asset.path, filename, p => console.log(`[${asset.name}] ${p}%`));
  }
  const blobUrl = await cacheGetBlobURL(filename);
  if (blobUrl) {
    console.log(asset.id, blobUrl);
    assetBlobUrlById.set(asset.id, blobUrl);
    return blobUrl;
  }
  throw new Error('Failed to retrieve asset from cache');
}

async function cacheEventAssets(evAssets = []) {
  for (const a of evAssets) {
    try {
      await cacheOneAsset(a);
    } catch (e) {
      console.log('Cache API err', a.name, String(e));
    }
  }
}

const getExt = (n = '') => {
  const m = n.match(/\.[a-z0-9]+$/i);
  return m ? m[0] : '.mp3';
};

async function cacheHasFile(name) {
  const cache = await caches.open(CACHE_NAME);
  const matchedResponse = await cache.match(name);
  return !!matchedResponse;
}

function isCacheApiSupported() {
  return !!(window.caches);
}

