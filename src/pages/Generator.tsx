import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHead, Segments, useToast } from '../components/ui';
import { CAPTION_SCENES, ROT, SITUATIONS } from '../data/content';
import { pick, rng, sample } from '../engine/rng';
import type { Style } from '../engine/rules';
import { translate } from '../engine/translate';
import { copyText, downloadCanvas, shareCanvas } from '../lib/share';
import { loadImage, photosForScene, type MemePhoto } from '../lib/memePhotos';
import { getImage, onImagesChanged, urlFor } from '../lib/imageStore';
import { ImagePicker } from '../components/ImagePicker';
import { useMode, useProgress } from '../lib/store';

const TONES: { id: Style; label: string }[] = [
  { id: 'natural', label: '🙂 Natural' }, { id: 'wholesome', label: '🫶 Wholesome' }, { id: 'dramatic', label: '🎭 Dramatic' },
  { id: 'sarcastic', label: '🙄 Sarcastic' }, { id: 'gamer', label: '🎮 Gamer' }, { id: 'college', label: '🎓 Campus' },
];
const GENERATIONS: { id: Style; label: string }[] = [
  { id: 'genz', label: 'Gen Z' }, { id: 'alpha', label: 'Gen Alpha' }, { id: 'retro', label: 'Retro internet' }, { id: 'brainrot', label: 'Brain rot' },
];

export default function Generator() {
  return (
    <div>
      <PageHead kicker="Meme Lab" title="Generate slang. Responsibly-ish.">
        Build sentences for any situation, make meme cards from real free-license meme pics (or your own), and push the Brain Rot Builder until it stops making sense.
      </PageHead>
      <div className="stack" style={{ gap: 28 }}>
        <SentenceGenerator />
        <MemeCards />
        <BrainRotBuilder />
      </div>
    </div>
  );
}

function useCountGenerated() {
  const { update } = useProgress();
  return () => update((s) => ({ ...s, stats: { ...s.stats, generated: s.stats.generated + 1 }, xp: s.xp + 1 }));
}

function SentenceGenerator() {
  const mode = useMode();
  const counted = useCountGenerated();
  const toast = useToast();
  const [situation, setSituation] = useState(SITUATIONS[0].id);
  const [tone, setTone] = useState<Style>('natural');
  const [gen, setGen] = useState<Style>('genz');
  const [intensity, setIntensity] = useState(5);
  const [length, setLength] = useState(1);
  const [seed, setSeed] = useState(1);

  const results = useMemo(() => {
    const s = SITUATIONS.find((x) => x.id === situation)!;
    const r = rng(seed * 31 + situation.length);
    return Array.from({ length: 4 }, (_, k) => {
      const english = sample(r, s.english, length).join(' ');
      return translate(english, { direction: 'en2slang', style: k % 2 ? tone : gen, intensity, mode, seed: seed * 10 + k });
    });
  }, [situation, tone, gen, intensity, length, mode, seed]);

  return (
    <section className="card">
      <h2>💬 Slang sentence generator</h2>
      <div className="grid auto" style={{ gap: 12 }}>
        <label className="field">Situation<select className="select" value={situation} onChange={(e) => setSituation(e.target.value)}>{SITUATIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <label className="field">Tone<select className="select" value={tone} onChange={(e) => setTone(e.target.value as Style)}>{TONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        <label className="field">Style / generation<select className="select" value={gen} onChange={(e) => setGen(e.target.value as Style)}>{GENERATIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
        <label className="field">Length<select className="select" value={length} onChange={(e) => setLength(Number(e.target.value))}><option value={1}>Short</option><option value={2}>Medium</option><option value={3}>Long</option></select></label>
        <label className="field">Intensity {intensity}/10<input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /></label>
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        {results.map((r, k) => (
          <div key={k} className="spread card flat" style={{ padding: 12, flexWrap: 'nowrap' }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}><Segments segments={r.segments} /></div>
              <div className="small muted">from: “{r.input}”</div>
            </div>
            <button className="btn sm" style={{ flex: 'none' }} aria-label="Copy" onClick={async () => { await copyText(r.text); toast('Copied!'); }}>📋</button>
          </div>
        ))}
      </div>
      <p className="small muted">Tap highlighted words to learn what they mean.</p>
      <button className="btn primary" onClick={() => { setSeed((s) => s + 1); counted(); }}>🔄 Generate more</button>
    </section>
  );
}

const FILL: Record<string, string[]> = {
  neg: ['negative aura', '-1000 aura', 'zero aura'], l: ['L', 'massive L'], cooked: ['cooked', 'so cooked'], school: ['school', 'third period'],
  goat: ['goated', 'him'], crash: ['Crashing out', 'Full crash out'], w: ['W', 'massive W'], cinema: ['Absolute cinema', 'Cinema'],
  lockin: ['locked in', 'fully locked in'], main: ['main character energy', 'main character moment'], sigma: ['sigma behavior', 'unbothered'],
  fr: ['fr', 'fr fr', 'no cap'], letcook: ['let him cook', 'let bro cook'], npc: ['NPC', 'full NPC'],
};
const THEMES = [
  { id: 'lime', bg: ['#c6ff3d', '#7bd400'], fg: '#0d0b1e' },
  { id: 'purple', bg: ['#9b5cff', '#4b1fb8'], fg: '#ffffff' },
  { id: 'coral', bg: ['#ff6b6b', '#c2185b'], fg: '#ffffff' },
  { id: 'ink', bg: ['#16132e', '#0d0b1e'], fg: '#c6ff3d' },
  { id: 'cyan', bg: ['#22d3ee', '#2563eb'], fg: '#0d0b1e' },
];

function fillCaption(line: string, r: () => number) {
  return line.replace(/\{(\w+)\}/g, (_m, k: string) => pick(r, FILL[k] ?? [k]));
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

type Bg = 'photo' | 'abstract' | 'upload';

function MemeCards() {
  const counted = useCountGenerated();
  const toast = useToast();
  const [scene, setScene] = useState(CAPTION_SCENES[0].id);
  const [seed, setSeed] = useState(1);
  const [theme, setTheme] = useState(THEMES[1].id);
  const [chosen, setChosen] = useState(0);
  const [bg, setBg] = useState<Bg>('photo');
  const [photos, setPhotos] = useState<MemePhoto[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoState, setPhotoState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = CAPTION_SCENES.find((x) => x.id === scene)!;
  const captions = useMemo(() => { const r = rng(seed * 97 + scene.length); return s.lines.map((l) => fillCaption(l, r)); }, [s, seed, scene]);
  const caption = custom.trim() || (captions[chosen] ?? captions[0]);
  const th = THEMES.find((t) => t.id === theme)!;
  const photo = bg === 'photo' ? photos[photoIdx % Math.max(1, photos.length)] : undefined;

  // fetch real photos for the scene
  useEffect(() => {
    if (bg !== 'photo') return;
    let live = true;
    setPhotoState('loading');
    photosForScene(scene)
      .then((list) => { if (live) { setPhotos(list); setPhotoIdx(0); setPhotoState(list.length ? 'idle' : 'error'); } })
      .catch(() => live && setPhotoState('error'));
    return () => { live = false; };
  }, [scene, bg]);

  // load the chosen background image
  useEffect(() => {
    const src = bg === 'photo' ? photo?.url : bg === 'upload' ? uploadUrl : null;
    if (!src) { setImg(null); return; }
    let live = true;
    loadImage(src).then((i) => live && setImg(i)).catch(() => { if (live) { setImg(null); setPhotoState('error'); } });
    return () => { live = false; };
  }, [bg, photo?.url, uploadUrl]);

  // resolve the selected library image to a URL (cleared if it gets deleted)
  useEffect(() => {
    if (!uploadId) { setUploadUrl(null); return; }
    let live = true;
    const load = () => getImage(uploadId).then((i) => { if (!live) return; setUploadUrl(i ? urlFor(i) : null); if (!i) setUploadId(null); }).catch(() => {});
    load();
    const off = onImagesChanged(load);
    return () => { live = false; off(); };
  }, [uploadId]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = 1080, H = 1080;
    c.width = W; c.height = H;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    if (img && bg !== 'abstract') {
      // classic meme: photo cover-fit + big outlined Impact caption
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2.6, w, h);
      let size = 92;
      const font = (n: number) => `900 ${n}px Impact, "Anton", "Arial Black", sans-serif`;
      ctx.font = font(size);
      let lines = wrap(ctx, caption.toUpperCase(), W - 90);
      while (lines.length > 3 && size > 52) { size -= 8; ctx.font = font(size); lines = wrap(ctx, caption.toUpperCase(), W - 90); }
      const credit = bg === 'photo' && photo ? photo.credit : '';
      const bottom = H - (credit ? 70 : 40);
      ctx.lineJoin = 'round';
      ctx.lineWidth = size / 7;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#fff';
      lines.forEach((l, k) => {
        const y = bottom - (lines.length - 1 - k) * size * 1.05 - size / 2;
        ctx.strokeText(l, W / 2, y);
        ctx.fillText(l, W / 2, y);
      });
      if (credit) {
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillRect(0, H - 44, W, 44);
        ctx.fillStyle = '#fff';
        ctx.font = '500 22px Inter, sans-serif';
        ctx.fillText(credit.length > 90 ? `${credit.slice(0, 88)}…` : credit, W / 2, H - 22);
      }
      return;
    }

    // abstract template: gradient, sticker shapes, giant emoji, caption, watermark
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.14; ctx.fillStyle = th.fg;
    ctx.beginPath(); ctx.arc(900, 180, 260, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-80, 760, 520, 420, 80); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '300px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.fillText(s.emoji, W / 2, 330);
    ctx.fillStyle = th.fg;
    let size = 76;
    ctx.font = `800 ${size}px "Bricolage Grotesque", Inter, sans-serif`;
    let lines = wrap(ctx, caption, W - 160);
    while (lines.length > 4 && size > 44) { size -= 6; ctx.font = `800 ${size}px "Bricolage Grotesque", Inter, sans-serif`; lines = wrap(ctx, caption, W - 160); }
    const top = 640 - ((lines.length - 1) * size * 1.12) / 2;
    lines.forEach((l, k) => ctx.fillText(l, W / 2, top + k * size * 1.12));
    ctx.font = '600 30px Inter, sans-serif'; ctx.globalAlpha = 0.75; ctx.textAlign = 'right';
    ctx.fillText('made with Slang Translator', W - 50, H - 50);
    ctx.globalAlpha = 1;
  }, [caption, th, s.emoji, img, bg, photo]);

  const exportable = () => {
    try { canvas.current?.toDataURL(); return true; } catch { toast('This image can’t be exported — try another photo.'); return false; }
  };

  return (
    <section className="card">
      <h2>🖼️ Meme caption generator</h2>
      <div className="grid two" style={{ alignItems: 'start' }}>
        <div className="stack">
          <label className="field">Scenario<select className="select" value={scene} onChange={(e) => { setScene(e.target.value); setChosen(0); }}>{CAPTION_SCENES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}</select></label>
          <div className="row" role="radiogroup" aria-label="Background">
            {([['photo', '📷 Real meme pics'], ['abstract', '🎨 Color card'], ['upload', '📁 Your image']] as const).map(([id, label]) => (
              <button key={id} className="chip" role="radio" aria-checked={bg === id} aria-pressed={bg === id} onClick={() => setBg(id)}>{label}</button>
            ))}
          </div>
          {bg === 'photo' && (
            <div className="stack" style={{ gap: 8 }}>
              <div className="row">
                <button className="btn sm" disabled={photos.length < 2} onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}>🔀 Next pic</button>
                <span className="small muted">{photoState === 'loading' ? 'Finding pics…' : photoState === 'error' ? 'Couldn’t reach Wikimedia Commons — using the color card.' : photo ? `${photoIdx % photos.length + 1}/${photos.length} · ${photo.label}` : ''}</span>
              </div>
              {photo && <p className="small muted" style={{ margin: 0 }}>Real photo or public-domain artwork from <a href={photo.page} target="_blank" rel="noreferrer noopener">Wikimedia Commons</a>. Credit: {photo.credit}. The credit is printed on the card; keep it when you share.</p>}
            </div>
          )}
          {bg === 'abstract' && (
            <div className="row" role="radiogroup" aria-label="Card color">
              {THEMES.map((t) => <button key={t.id} role="radio" aria-checked={theme === t.id} aria-label={`${t.id} theme`} onClick={() => setTheme(t.id)} style={{ width: 36, height: 36, borderRadius: 10, cursor: 'pointer', background: `linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]})`, border: theme === t.id ? '3px solid var(--text)' : '2px solid var(--line)' }} />)}
            </div>
          )}
          {bg === 'upload' && (
            <ImagePicker
              selected={uploadId ? [uploadId] : []}
              onToggle={(id) => setUploadId((cur) => (cur === id ? null : id))}
              onAdded={(ids) => setUploadId(ids[0])}
              label="Pick a background"
            />
          )}
          <div className="stack" style={{ gap: 8 }}>
            {captions.map((c, k) => (
              <button key={k} className={`option ${chosen === k && !custom.trim() ? 'correct' : ''}`} onClick={() => { setChosen(k); setCustom(''); }} aria-pressed={chosen === k && !custom.trim()}>{c}</button>
            ))}
            <label className="field small">
              <span>…or write your own caption</span>
              <input className="input" value={custom} maxLength={120} onChange={(e) => setCustom(e.target.value)} placeholder="When the group chat goes silent after your joke" />
            </label>
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => { setSeed((x) => x + 1); counted(); }}>🔄 New captions</button>
            <button className="btn" onClick={async () => { await copyText(caption); toast('Caption copied'); }}>📋 Copy caption</button>
          </div>
        </div>
        <div className="meme-card stack">
          <canvas ref={canvas} aria-label={`Meme card: ${caption}`} role="img" />
          <div className="btn-row">
            <button className="btn primary" onClick={() => { if (canvas.current && exportable()) { downloadCanvas(canvas.current, `slang-meme-${scene}.png`); counted(); } }}>⬇️ Download PNG</button>
            <button className="btn" onClick={async () => { if (canvas.current && exportable()) { const r = await shareCanvas(canvas.current, `slang-meme-${scene}.png`, caption); toast(r === 'shared' ? 'Shared!' : 'Downloaded'); } }}>📤 Share image</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrainRotBuilder() {
  const mode = useMode();
  const counted = useCountGenerated();
  const toast = useToast();
  const [chaos, setChaos] = useState(3);
  const [seed, setSeed] = useState(1);
  const sentence = useMemo(() => {
    const r = rng(seed * 13 + chaos);
    // each part is drawn from a tier; higher chaos pushes tiers up and mixes them
    const tierFor = () => Math.max(0, Math.min(2, Math.floor((chaos - 1) / 3.5) + (r() < (chaos % 4) / 6 ? 1 : 0)));
    return `${pick(r, ROT.subjects[tierFor()])} ${pick(r, ROT.verbs[tierFor()])} ${pick(r, ROT.tails[tierFor()])}`;
  }, [seed, chaos]);
  const decoded = useMemo(() => translate(sentence, { direction: 'slang2en', style: 'natural', intensity: 1, mode }), [sentence, mode]);
  const nonsense = chaos >= 7;

  return (
    <section className="card">
      <h2>🧠 Brain Rot Sentence Builder</h2>
      <label className="field" style={{ maxWidth: 480 }}>
        <span className="spread"><span>Chaos: {chaos}/10</span><span className="muted small">{chaos <= 3 ? 'Plausibly human' : chaos <= 6 ? 'Group chat energy' : 'Pure brain rot 🌀'}</span></span>
        <input type="range" min={1} max={10} value={chaos} onChange={(e) => setChaos(Number(e.target.value))} aria-label="Chaos level" />
      </label>
      <div className={`card ${nonsense ? 'purple' : 'flat'}`} style={{ marginTop: 14 }}>
        {nonsense && <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', marginBottom: 8 }}>🌀 Intentionally nonsensical</span>}
        <div className="prompt-text">{sentence}</div>
        <div className="small" style={{ marginTop: 10, opacity: 0.85 }}>Roughly decoded: <Segments segments={decoded.segments} /></div>
      </div>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={() => { setSeed((s) => s + 1); counted(); }}>🎲 Build another</button>
        <button className="btn" onClick={async () => { await copyText(sentence); toast('Copied. Use responsibly.'); }}>📋 Copy</button>
      </div>
      {nonsense && <p className="small muted">At this chaos level the sentence is meme noise on purpose — it doesn’t carry a real meaning.</p>}
    </section>
  );
}
