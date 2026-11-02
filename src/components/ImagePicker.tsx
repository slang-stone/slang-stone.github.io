import { useEffect, useRef, useState } from 'react';
import { addImages, deleteImage, listImages, MAX_IMAGES, onImagesChanged, urlFor, type StoredImage } from '../lib/imageStore';
import { useToast } from './ui';

export function useImages() {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const load = () => listImages().then(setImages, (e: Error) => setError(e.message));
    load();
    return onImagesChanged(load);
  }, []);
  return { images, error };
}

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  /** called with the ids of freshly added images, e.g. to auto-select them */
  onAdded?: (ids: string[]) => void;
  label?: string;
}

/** Upload (browse, drag & drop, paste) + a thumbnail gallery of the on-device image library. */
export function ImagePicker({ selected, onToggle, onAdded, label = 'My images' }: Props) {
  const { images, error } = useImages();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = async (files: Iterable<File>) => {
    setBusy(true);
    try {
      const { ids, skipped } = await addImages(files);
      if (ids.length) { toast(`Added ${ids.length} image${ids.length > 1 ? 's' : ''} 📸`); onAdded?.(ids); }
      if (skipped.length) toast(`Skipped: ${skipped[0]}${skipped.length > 1 ? ` (+${skipped.length - 1} more)` : ''}`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // paste an image from the clipboard anywhere on the page while the picker is visible
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
      if (files.length) { e.preventDefault(); add(files); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  if (error) return <p className="small muted">{error} You can still use the other backgrounds.</p>;

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div
        className={`dropzone ${over ? 'over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Add images: click to browse, drag and drop, or paste"
        onClick={() => input.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
      >
        <div style={{ fontSize: '1.6rem' }}>{busy ? '⏳' : '📸'}</div>
        <strong>{busy ? 'Adding…' : 'Drop pics here, click to browse, or paste'}</strong>
        <span className="small muted">JPG, PNG, GIF, WebP · up to {MAX_IMAGES} saved · stays on this device</span>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ''; }} />
      </div>

      {images.length > 0 && (
        <>
          <div className="spread small"><strong>{label}</strong><span className="muted">{images.length}/{MAX_IMAGES}</span></div>
          <div className="thumbs">
            {images.map((img) => {
              const on = selected.includes(img.id);
              return (
                <div key={img.id} className={`thumb ${on ? 'on' : ''}`}>
                  <button className="thumb-pick" aria-pressed={on} aria-label={`${on ? 'Selected: ' : 'Select '}${img.name}`} onClick={() => onToggle(img.id)}>
                    <img src={urlFor(img)} alt="" loading="lazy" />
                    {on && <span className="thumb-check" aria-hidden="true">✓</span>}
                  </button>
                  <button className="thumb-del" aria-label={`Delete ${img.name}`} title="Delete from this device" onClick={() => { deleteImage(img.id); toast('Image deleted'); }}>✕</button>
                </div>
              );
            })}
          </div>
        </>
      )}
      <p className="small muted" style={{ margin: 0 }}>Images are saved in this browser only and are never uploaded. Large photos are shrunk and location data is removed. Only use pictures you’re allowed to share, and ask before using photos of other people.</p>
    </div>
  );
}
