async function opfsSaveFromURL(url, name, onProgress) {

  const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });

  if (!resp.ok || !resp.body) throw new Error(`fetch failed: ${resp.status}`);

  const total = Number(resp.headers.get('Content-Length') || 0);
  const reader = resp.body.getReader();

  const root = await opfsRoot();
  const handle = await root.getFileHandle(name, { create: true });
  const writable = await handle.createWritable({ keepExistingData: false });

  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await writable.write(value);
    received += value.byteLength;
    if (onProgress && total) onProgress(Math.round((received / total) * 100));
  }
//   logToList("fetched file")
  await writable.close();
}

async function opfsGetBlobURL(name) {
  const root = await opfsRoot();
  const handle = await root.getFileHandle(name, { create: false });
  const file = await handle.getFile();
  return URL.createObjectURL(file);
}

const assetBlobUrlById = new Map();

async function cacheOneAssetOPFS(asset) {
  const filename = `${asset.id}${getExt(asset.name)}`;
  if (!(await opfsHasFile(filename))) {
    logToList('OPFS downloading', asset.name);
    await opfsSaveFromURL(asset.path, filename, p => logToList(`[${asset.name}] ${p}%`));
  }
//   logToList('Hardik Purohit')
  const blobUrl = await opfsGetBlobURL(filename);
  logToList(asset.id, blobUrl)
  assetBlobUrlById.set(asset.id, blobUrl);
  return blobUrl;
}
async function cacheEventAssetsOPFS(evAssets=[]) {
  for (const a of evAssets) {
    try { await cacheOneAssetOPFS(a); } catch (e) { logToList('OPFS err', a.name, String(e)); }
  }
}
const getExt = (n='') => {
  const m = n.match(/\.[a-z0-9]+$/i);
  return m ? m[0] : '.mp3';
};

async function opfsHasFile(name) {
  try {

    const root = await opfsRoot();
    await root.getFileHandle(name, { create: false });
    return true;
  } catch { 
    return false; }
}

async function opfsSupported() {
  return !!(navigator.storage && navigator.storage.getDirectory);
}
async function opfsRoot() {
  return navigator.storage.getDirectory();
}



