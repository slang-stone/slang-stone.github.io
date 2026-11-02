import { useMemo, useState } from 'react';
import { GameShell, type GameResult } from '../../components/game';
import { DECODER } from '../../data/content';
import { detectSlang } from '../../engine/translate';
import { rng, sample, shuffle } from '../../engine/rng';
import { Segments } from '../../components/ui';
import { useMode, useProgress } from '../../lib/store';
import { plainOf } from '../../data';
import { playRight, playWrong } from '../../lib/sfx';

export default function BrainRotDecoder() {
  return (
    <GameShell id="brain-rot-decoder" title="Brain Rot Decoder" emoji="🧠" accent="var(--purple)"
      tagline="Maximum chaos sentences. Find the meaning hiding inside."
      howTo={<>
        <p>Each sentence is deliberately ridiculous. Pick the interpretation that captures what it’s trying to say — or write your own and see how it compares.</p>
        <p className="small">Sentences tagged “absurd” are meme noise on purpose; there’s no single precise translation, only a best guess.</p>
      </>}
      play={({ difficulty, seed, onFinish }) => <Run difficulty={difficulty} seed={seed} onFinish={onFinish} />}
    />
  );
}

function Run({ difficulty, seed, onFinish }: { difficulty: number; seed: number; onFinish: (r: GameResult) => void }) {
  const mode = useMode();
  const { answer } = useProgress();
  const items = useMemo(() => {
    const r = rng(seed);
    const filtered = DECODER.filter((d) => (difficulty === 1 ? !d.absurd || r() < 0.5 : difficulty === 3 ? d.absurd || r() < 0.4 : true));
    return sample(r, filtered.length >= 6 ? filtered : DECODER, 6).map((d) => {
      const order = shuffle(r, d.options.map((_, i) => i));
      return { ...d, options: order.map((i) => d.options[i]), answer: order.indexOf(d.answer) };
    });
  }, [seed, difficulty]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [own, setOwn] = useState('');
  const [ownChecked, setOwnChecked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = items[i];
  const hits = useMemo(() => detectSlang(item.text, mode), [item, mode]);

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const ok = k === item.answer;
    answer(undefined, ok, 12);
    if (ok) playRight(); else playWrong();
    if (ok) { setScore((s) => s + 10 + (item.absurd ? 5 : 0)); setCorrect((c) => c + 1); }
  };

  // Own interpretation: give credit for each decoded slang meaning it captures.
  const checkOwn = () => {
    const text = own.toLowerCase();
    const caught = hits.filter((h) => plainOf(h.term).toLowerCase().split(/\s+/).some((w) => w.length > 3 && text.includes(w))).length;
    const pts = Math.min(15, caught * 5);
    setOwnChecked(pts);
    setScore((s) => s + pts);
  };

  const nextItem = () => {
    if (i + 1 >= items.length) { onFinish({ score, correct, total: items.length, missed: [] }); return; }
    setI(i + 1); setPicked(null); setOwn(''); setOwnChecked(null);
  };

  const segs = useMemo(() => {
    const out: { text: string; term?: any }[] = [];
    let last = 0;
    for (const h of hits) { if (h.start > last) out.push({ text: item.text.slice(last, h.start) }); out.push({ text: item.text.slice(h.start, h.end), term: h.term }); last = h.end; }
    out.push({ text: item.text.slice(last) });
    return out;
  }, [hits, item]);

  return (
    <div className="stack">
      <div className="hud"><span className="stat">{i + 1}/{items.length}</span><span className="stat">⭐ {score}</span></div>
      <div className="card purple">
        <div className="row" style={{ marginBottom: 8 }}>{item.absurd && <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>🌀 Deliberately absurd</span>}</div>
        <div className="prompt-text">“{item.text}”</div>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        {item.options.map((o, k) => (
          <button key={k} className={`option ${picked !== null && k === item.answer ? 'correct' : ''} ${picked === k && k !== item.answer ? 'wrong' : ''}`} disabled={picked !== null} onClick={() => choose(k)}>
            <span className="key">{k + 1}</span><span>{o}</span>
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={`feedback ${picked === item.answer ? '' : 'bad'}`}>
          <strong>{picked === item.answer ? 'Decoded! ' : 'Not that one. '}</strong>{item.note}
          {item.absurd && <div className="small muted" style={{ marginTop: 6 }}>Absurd sentences don’t have one exact translation — this is the most reasonable reading.</div>}
          <div style={{ marginTop: 8 }} className="small">Tap the highlighted words for definitions: <Segments segments={segs} /></div>
        </div>
      )}
      {picked !== null && (
        <details className="card flat">
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Bonus: write your own interpretation (+ up to 15)</summary>
          <div className="stack" style={{ marginTop: 10 }}>
            <textarea className="textarea" style={{ minHeight: 80 }} value={own} onChange={(e) => setOwn(e.target.value)} placeholder="In plain English, this means…" disabled={ownChecked !== null} />
            {ownChecked === null ? <button className="btn" disabled={!own.trim()} onClick={checkOwn}>Check mine</button>
              : <div className="feedback">+{ownChecked} — you captured {ownChecked / 5} of {hits.length} slang meanings. There’s no single right wording; compare with the answer above.</div>}
          </div>
        </details>
      )}
      {picked !== null && <div><button className="btn primary" onClick={nextItem}>{i + 1 >= items.length ? 'See results' : 'Next →'}</button></div>}
    </div>
  );
}
