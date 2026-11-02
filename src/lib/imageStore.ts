// "My images": user pictures stored only on this device (IndexedDB). Nothing is ever uploaded.
// Images are downscaled on import so the library stays small.

export interface StoredImage { id: string; name: string; blob: Blob; w: number; h: number; at: number }

const DB = 'slang-translator-images';
const STORE = 'images';
const MAX_SIDE = 1080;
export const MAX_IMAGES = 40;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

let dbp: Promise<IDBDatabase> | null = null;
function db() {
  dbp ??= new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('This browser can’t store images.'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Image storage is blocked in this browser.'));
  });
  return dbp;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = fn(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

// listeners so every picker on the page refreshes together
const subs = new Set<() => void>();
export const onImagesChanged = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };
const changed = () => subs.forEach((f) => f());

export async function listImages(): Promise<StoredImage[]> {
  const all = await tx<StoredImage[]>('readonly', (s) => s.getAll());
  return all.sort((a, b) => b.at - a.at);
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  return tx<StoredImage | undefined>('readonly', (s) => s.get(id));
}

export async function deleteImage(id: string) {
  await tx('readwrite', (s) => s.delete(id));
  changed();
}

/** Resize to fit MAX_SIDE and re-encode (this also strips EXIF data such as GPS location). */
async function normalize(file: Blob): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, type, 0.88));
  if (!blob) throw new Error('Couldn’t process that image.');
  return { blob, w, h };
}

/** Add images; returns the new ids plus a message for anything skipped. */
export async function addImages(files: Iterable<File>): Promise<{ ids: string[]; skipped: string[] }> {
  const existing = await listImages();
  const ids: string[] = [];
  const skipped: string[] = [];
  let room = MAX_IMAGES - existing.length;
  for (const f of files) {
    if (!f.type.startsWith('image/') || f.type === 'image/svg+xml') { skipped.push(`${f.name || 'file'}: not a photo`); continue; }
    if (f.size > MAX_INPUT_BYTES) { skipped.push(`${f.name}: bigger than 25 MB`); continue; }
    if (room <= 0) { skipped.push(`${f.name}: library full (${MAX_IMAGES} max) — delete some first`); continue; }
    try {
      const { blob, w, h } = await normalize(f);
      const img: StoredImage = { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, name: (f.name || 'pasted image').slice(0, 60), blob, w, h, at: Date.now() };
      await tx('readwrite', (s) => s.put(img));
      ids.push(img.id);
      room--;
    } catch {
      skipped.push(`${f.name || 'file'}: couldn’t read it`);
    }
  }
  if (ids.length) changed();
  return { ids, skipped };
}

/** Object URL for a stored image (cached; revoked when the image is deleted or the page unloads). */
const urls = new Map<string, string>();
export function urlFor(img: StoredImage) {
  let u = urls.get(img.id);
  if (!u) { u = URL.createObjectURL(img.blob); urls.set(img.id, u); }
  return u;
}
onImagesChanged(async () => {
  const live = new Set((await listImages().catch(() => [])).map((i) => i.id));
  for (const [id, u] of urls) if (!live.has(id)) { URL.revokeObjectURL(u); urls.delete(id); }
});
