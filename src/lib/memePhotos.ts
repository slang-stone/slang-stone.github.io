// Real (non-AI) meme images from Wikimedia Commons, limited to public-domain and free licenses
// so cards can be downloaded and shared. Every image carries its author + license credit.
//
// Two pools:
//  - CLASSICS: famous public-domain paintings that are already well-known memes
//  - per-scene searches for real photos (mostly animals — no photos of private people)

export interface MemePhoto { title: string; label: string; url: string; credit: string; license: string; page: string }

/** Public-domain artworks that are classic internet memes. Exact Commons file titles. */
export const CLASSICS: { title: string; label: string; scenes: string[] }[] = [
  { title: 'File:Joseph Ducreux (French) - Self-Portrait, Yawning - Google Art Project.jpg', label: 'Yawning Ducreux', scenes: ['monday', 'weekend', 'group'] },
  { title: 'File:Self-portrait, entitled The Surprise in Terror, by Joseph Ducreux.jpg', label: 'Shook Ducreux', scenes: ['test', 'snack', 'gaming'] },
  { title: 'File:Edvard Munch, 1893, The Scream, oil, tempera and pastel on cardboard, 91 x 73 cm, National Gallery of Norway.jpg', label: 'The Scream', scenes: ['test', 'monday', 'group', 'gaming'] },
  { title: 'File:Grant DeVolson Wood - American Gothic.jpg', label: 'American Gothic', scenes: ['group', 'weekend', 'snack'] },
  { title: 'File:Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg', label: 'Mona Lisa', scenes: ['win', 'snack', 'pet'] },
  { title: 'File:Caspar David Friedrich - Wanderer above the sea of fog.jpg', label: 'Wanderer (main character)', scenes: ['win', 'weekend', 'group'] },
  { title: 'File:Michelangelo - Creation of Adam (cropped).jpg', label: 'Creation of Adam', scenes: ['snack', 'win', 'gaming'] },
  { title: 'File:1665 Girl with a Pearl Earring.jpg', label: 'Pearl Earring side-eye', scenes: ['snack', 'group', 'pet'] },
  { title: 'File:Vincent van Gogh - Self-Portrait - Google Art Project (454045).jpg', label: 'Van Gogh, unbothered', scenes: ['monday', 'test', 'weekend'] },
];

/** Search terms for real photos per caption scene. Fixed lists only — no free-text search, to keep results kid-safe. */
export const SCENE_QUERIES: Record<string, string[]> = {
  monday: ['yawning cat', 'sleepy dog', 'tired puppy'],
  test: ['surprised owl', 'shocked cat', 'confused dog'],
  snack: ['dog begging food', 'squirrel eating', 'seagull chips'],
  win: ['happy dog running', 'cat jumping', 'otter floating'],
  group: ['meerkats group', 'penguins group', 'ducklings row'],
  pet: ['cat on table', 'cat in box', 'dog head tilt'],
  gaming: ['cat keyboard', 'raccoon', 'angry cat'],
  weekend: ['cat sleeping sofa', 'sloth hanging', 'dog sleeping blanket'],
};

const API = 'https://commons.wikimedia.org/w/api.php';
const FREE = /^(public domain|pd|cc0|cc by(-sa)? \d)/i;
const cache = new Map<string, MemePhoto[]>();

const stripHtml = (s: string) => {
  const d = document.createElement('div');
  d.innerHTML = s;
  return (d.textContent ?? '').replace(/\s+/g, ' ').trim();
};

interface Page { title: string; index?: number; imageinfo?: { thumburl: string; mime: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }

function toPhotos(pages: Page[], labelFor: (p: Page) => string): MemePhoto[] {
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .flatMap((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii || !/jpeg|png/.test(ii.mime)) return [];
      const license = ii.extmetadata.LicenseShortName?.value ?? '';
      if (!FREE.test(license)) return [];
      const artist = stripHtml(ii.extmetadata.Artist?.value ?? 'Unknown').slice(0, 60) || 'Unknown';
      return [{ title: p.title, label: labelFor(p), url: ii.thumburl, license, credit: `${artist} · ${license} · Wikimedia Commons`, page: ii.descriptionurl }];
    });
}

async function query(params: Record<string, string>): Promise<Page[]> {
  const q = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '1080', iiextmetadatafilter: 'LicenseShortName|Artist', ...params,
  });
  const r = await fetch(`${API}?${q}`);
  if (!r.ok) throw new Error('Wikimedia Commons is unreachable');
  const j = await r.json();
  return Object.values(j.query?.pages ?? {}) as Page[];
}

/** Public-domain classics sorted into "right answer" and "wrong answer" reaction pools. */
export const REACT_RIGHT = ['Wanderer (main character)', 'Mona Lisa', 'Creation of Adam', 'Van Gogh, unbothered'];
export const REACT_WRONG = ['The Scream', 'Shook Ducreux', 'Yawning Ducreux', 'American Gothic'];

let classicsP: Promise<MemePhoto[]> | null = null;
export function classicPhotos() {
  classicsP ??= query({ titles: CLASSICS.map((c) => c.title).join('|'), iiurlwidth: '440' })
    .then((pages) => toPhotos(pages, (p) => CLASSICS.find((c) => c.title === p.title)?.label ?? 'Classic art'))
    .catch((e) => { classicsP = null; throw e; });
  return classicsP;
}

/** Classic meme paintings + real photos for a scene. Cached per scene. */
export async function photosForScene(scene: string): Promise<MemePhoto[]> {
  const hit = cache.get(scene);
  if (hit) return hit;
  const classics = CLASSICS.filter((c) => c.scenes.includes(scene));
  const [art, ...searches] = await Promise.all([
    classics.length ? query({ titles: classics.map((c) => c.title).join('|') }) : Promise.resolve([]),
    ...(SCENE_QUERIES[scene] ?? []).map((s) =>
      query({ generator: 'search', gsrsearch: `${s} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '6' }).catch(() => [] as Page[]),
    ),
  ]);
  const artPhotos = toPhotos(art, (p) => classics.find((c) => c.title.replace(/_/g, ' ') === p.title)?.label ?? 'Classic art');
  const real = searches.flatMap((pages, k) => toPhotos(pages, () => SCENE_QUERIES[scene][k]).slice(0, 4));
  // interleave so classics and real photos alternate
  const out: MemePhoto[] = [];
  for (let i = 0; i < Math.max(artPhotos.length, real.length); i++) {
    if (artPhotos[i]) out.push(artPhotos[i]);
    if (real[i]) out.push(real[i]);
  }
  cache.set(scene, out);
  return out;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Wikimedia sends CORS headers, so the canvas stays exportable
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
}
