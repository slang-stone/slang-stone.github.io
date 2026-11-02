import { useEffect, useRef, useState } from 'react';
import { getImage, urlFor } from '../lib/imageStore';
import { classicPhotos, REACT_RIGHT, REACT_WRONG } from '../lib/memePhotos';
import { REACTION_EVENT } from '../lib/sfx';
import { useProgress } from '../lib/store';

const RIGHT_TEXT = ['W', '+1000 AURA', 'ATE', 'GOATED', 'SHEESH'];
const WRONG_TEXT = ['L', 'COOKED', '-1000 AURA', 'BRUH', 'NOT IT'];
const any = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Pops a meme reaction picture in the corner when a game reports a right/wrong answer. */
export function ReactionOverlay() {
  const { p } = useProgress();
  const { reactions, reactRight, reactWrong } = p.settings;
  const [shown, setShown] = useState<{ key: number; kind: 'right' | 'wrong'; src: string; text: string } | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    if (reactions === 'off') return;
    const on = async (e: Event) => {
      const kind = (e as CustomEvent<'right' | 'wrong'>).detail;
      let src: string | undefined;
      try {
        if (reactions === 'mine') {
          const ids = kind === 'right' ? reactRight : reactWrong;
          if (!ids.length) return;
          const img = await getImage(any(ids));
          src = img && urlFor(img);
        } else {
          const pool = (await classicPhotos()).filter((ph) => (kind === 'right' ? REACT_RIGHT : REACT_WRONG).includes(ph.label));
          src = pool.length ? any(pool).url : undefined;
        }
      } catch { return; /* offline or storage blocked: just skip the picture */ }
      if (!src) return;
      setShown({ key: Date.now(), kind, src, text: any(kind === 'right' ? RIGHT_TEXT : WRONG_TEXT) });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setShown(null), 1600);
    };
    window.addEventListener(REACTION_EVENT, on);
    // warm the classic pool so the first reaction appears instantly
    if (reactions === 'classic') classicPhotos().then((list) => list.forEach((ph) => { new Image().src = ph.url; })).catch(() => {});
    return () => window.removeEventListener(REACTION_EVENT, on);
  }, [reactions, reactRight, reactWrong]);

  if (!shown) return null;
  return (
    <div key={shown.key} className={`reaction ${shown.kind}`} aria-hidden="true">
      <img src={shown.src} alt="" />
      <span>{shown.text}</span>
    </div>
  );
}
