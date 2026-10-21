const DB = 'mihon-offline-v1';
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('chapters', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', mode);
    const req = action(tx.objectStore('chapters'));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('No se pudo guardar la descarga.')); };
  });
}
export const offline = {
  list: () => transaction('readonly', store => store.getAll()),
  get: id => transaction('readonly', store => store.get(id)),
  remove: id => transaction('readwrite', store => store.delete(id)),
  async download(chapter, mangaTitle, urls, onProgress) {
    if (!urls.length) throw new Error('El capítulo no contiene páginas.');
    if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false);
    const images = [];
    for (const url of urls) {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok || response.type === 'opaque') throw new Error('No se pudo descargar una página del capítulo.');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('La fuente no devolvió una imagen válida.');
      images.push(blob); onProgress(images.length, urls.length);
    }
    await transaction('readwrite', store => store.put({ id: chapter.id, name: chapter.name, mangaTitle, images, savedAt: Date.now() }));
  },
};
