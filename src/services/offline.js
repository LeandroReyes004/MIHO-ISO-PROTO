const DB = 'mihon-offline-v1';
const textEncoder = new TextEncoder();

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function uint16(value) { return [value & 0xff, (value >>> 8) & 0xff]; }
function uint32(value) { return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]; }

function imageExtension(blob) {
  const type = blob.type.toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  if (type.includes('gif')) return 'gif';
  if (type.includes('avif')) return 'avif';
  return 'jpg';
}

// CBZ is a regular ZIP archive. Storing the images without recompressing them
// avoids quality loss and keeps this export usable without an extra dependency.
async function createCbz(images) {
  const files = await Promise.all(images.map(async (blob, index) => ({
    name: `${String(index + 1).padStart(3, '0')}.${imageExtension(blob)}`,
    bytes: new Uint8Array(await blob.arrayBuffer()),
  })));
  const parts = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = textEncoder.encode(file.name);
    const crc = crc32(file.bytes);
    const local = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(crc), ...uint32(file.bytes.length), ...uint32(file.bytes.length), ...uint16(name.length), ...uint16(0), ...name,
    ]);
    parts.push(local, file.bytes);
    central.push(new Uint8Array([
      0x50, 0x4b, 0x01, 0x02, ...uint16(20), ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(crc), ...uint32(file.bytes.length), ...uint32(file.bytes.length), ...uint16(name.length), ...uint16(0), ...uint16(0),
      ...uint16(0), ...uint16(0), ...uint32(0), ...uint32(offset), ...name,
    ]));
    offset += local.length + file.bytes.length;
  }
  const centralSize = central.reduce((total, entry) => total + entry.length, 0);
  const end = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06, ...uint16(0), ...uint16(0), ...uint16(files.length), ...uint16(files.length),
    ...uint32(centralSize), ...uint32(offset), ...uint16(0),
  ]);
  return new Blob([...parts, ...central, end], { type: 'application/vnd.comicbook+zip' });
}

export const safeFileName = (value) => String(value || 'Sin título').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
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
    await transaction('readwrite', store => store.put({ id: chapter.id, name: chapter.name, chapterNumber: chapter.chapterNumber, mangaTitle, images, savedAt: Date.now() }));
  },
  async exportCbz(item) {
    if (!item?.images?.length) throw new Error('Este capítulo no tiene páginas guardadas.');
    return createCbz(item.images);
  },
};
