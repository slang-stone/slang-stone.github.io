import { useMemo, useState } from 'react';
import { GameShell, QuizRunner } from '../components/game';
import { PageHead, useToast } from '../components/ui';
import { EN_CHALLENGES, SLANG_CHALLENGES, type ChallengeItem } from '../data/content';
import { definitionQ, meaningQ, pickTerms, pool, sentenceQ, audienceQ } from '../engine/questions';
import { rng, sample, shuffle } from '../engine/rng';
import { detectSlang } from '../engine/translate';
import { aiAvailable } from '../lib/ai';
import { shareText } from '../lib/share';
import { useMode, useProgress } from '../lib/store';

type Tab = 'quiz' | 'en' | 'slang';

export default function Quiz() {
  const [tab, setTab] = useState<Tab>('quiz');
  return (
    <div>
      <PageHead kicker="Slang Quiz" title="Test your slang license.">
        A mixed knowledge quiz, plus translation challenges where you write the slang yourself. Subjective answers are scored with a transparent rubric — there’s rarely just one right way to say something.
      </PageHead>
      <div className="dir-toggle" role="tablist" style={{ marginBottom: 18 }}>
        {([['quiz', '📝 Knowledge quiz'], ['en', '✍️ English → Slang challenge'], ['slang', '🔍 Slang → English challenge']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {tab === 'quiz' && <KnowledgeQuiz />}
      {tab === 'en' && <Challenge items={EN_CHALLENGES} direction="en" key="en" />}
      {tab === 'slang' && <Challenge items={SLANG_CHALLENGES} direction="slang" key="slang" />}
    </div>
  );
}

function KnowledgeQuiz() {
  const mode = useMode();
  return (
    <GameShell id="slang-quiz" title="Slang Knowledge Quiz" emoji="📝" accent="var(--purple)"
      tagline="12 mixed questions: definitions, meanings, real sentences, and who-says-what."
      howTo={<p>No timer. Each question type pulls from the dictionary. Missed words land in your “Words I keep forgetting” list.</p>}
      play={({ difficulty, seed, onFinish }) => <QuizBody difficulty={difficulty} seed={seed} onFinish={onFinish} mode={mode} />}
    />
  );
}

function QuizBody({ difficulty, seed, onFinish, mode }: any) {
  const qs = useMemo(() => {
    const r = rng(seed);
    const terms = pool(mode, difficulty);
    const makers = [definitionQ, meaningQ, sentenceQ];
    return pickTerms(r, terms, 12).map((t, i) => (i % 6 === 5 ? audienceQ(r, t) : makers[i % 3](r, t, terms)));
  }, [seed, mode, difficulty]);
  return <QuizRunner next={(i) => qs[i] ?? null} practice base={10} streakBonus={2} onFinish={onFinish} />;
}

// ---------- translation challenges -----------------------------------------------------

interface Score { meaning: number; natural: number; tone: number; creativity: number; total: number; notes: string[]; matched: string[]; missing: string[] }

const has = (text: string, w: string) => new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`, 'i').test(text);

/** Deterministic rubric: meaning (concepts covered), naturalness, tone, creativity. */
export function scoreAnswer(item: ChallengeItem, answer: string, direction: 'en' | 'slang'): Score {
  const text = answer.toLowerCase().replace(/[’']/g, "'");
  const matched = item.concepts.filter((c) => c.words.some((w) => has(text, w.toLowerCase()))).map((c) => c.label);
  const missing = item.concepts.map((c) => c.label).filter((l) => !matched.includes(l));
  const meaning = Math.round((matched.length / item.concepts.length) * 40);
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const slang = detectSlang(answer, 'teen');
  const notes: string[] = [];
  let natural = 25, tone = 20, creativity = 0;
  if (direction === 'en') {
    const density = slang.length / Math.max(1, words);
    if (slang.length === 0) { natural = 10; notes.push('No slang detected — it reads as plain English.'); }
    else if (density > 0.6 && words > 3) { natural = 12; notes.push('That’s a lot of slang per word. Real people usually use one or two terms per sentence.'); }
    if (words > 25) { natural -= 5; notes.push('Slang tends to be short and punchy.'); }
    const known = new Set(item.examples.join(' ').toLowerCase().split(/\W+/));
    const fresh = slang.filter((s) => !s.surface.toLowerCase().split(/\W+/).every((w) => known.has(w)));
    creativity = Math.min(15, fresh.length * 8);
    if (fresh.length) notes.push(`Creative pick: ${fresh.map((f) => `“${f.surface}”`).join(', ')} — not in our examples.`);
    if (slang.some((s) => s.term.tone === 'negative') && !/cooked|trouble|lie|boring|embarrass|average|mid|stop|fries/i.test(item.prompt)) {
      tone = 8; notes.push('Some slang here has a negative tone that may not match the original.');
    }
  } else {
    if (slang.length > 0) { natural = 12; notes.push(`Still contains slang: ${slang.map((s) => `“${s.surface}”`).join(', ')}. Try plainer words.`); }
    creativity = words >= 4 ? 15 : 8;
  }
  if (!answer.trim()) return { meaning: 0, natural: 0, tone: 0, creativity: 0, total: 0, notes: ['Write something first!'], matched, missing };
  const total = Math.max(0, Math.min(100, meaning + natural + tone + creativity));
  return { meaning, natural, tone, creativity, total, notes, matched, missing };
}

function Challenge({ items, direction }: { items: ChallengeItem[]; direction: 'en' | 'slang' }) {
  const { update, addXP } = useProgress();
  const toast = useToast();
  const [order] = useState(() => shuffle(rng(Date.now()), items));
  const [i, setI] = useState(0);
  const [method, setMethod] = useState<'type' | 'choose' | 'build'>('type');
  const [text, setText] = useState('');
  const [built, setBuilt] = useState<string[]>([]);
  const [result, setResult] = useState<Score | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const item = order[i % order.length];

  // "choose" options: one of this item's examples + examples from other items
  const choices = useMemo(() => {
    const r = rng(i + 1);
    const others = sample(r, items.filter((x) => x !== item).map((x) => x.examples[0]), 3);
    return shuffle(r, [item.examples[0], ...others]);
  }, [item, items, i]);
  // "build" pieces: words from this item's rubric plus decoys
  const pieces = useMemo(() => {
    const r = rng(i + 7);
    const own = item.concepts.flatMap((c) => c.words.slice(0, 2));
    const decoys = sample(r, items.filter((x) => x !== item).flatMap((x) => x.concepts.flatMap((c) => c.words.slice(0, 1))), 5);
    return shuffle(r, [...new Set([...own, ...decoys])]);
  }, [item, items, i]);

  const answer = method === 'build' ? built.join(' ') : text;
  const submit = async () => {
    const s = scoreAnswer(item, answer, direction);
    setResult(s);
    addXP(Math.round(s.total / 10) + 2);
    update((st) => ({ ...st, stats: { ...st.stats, challenges: st.stats.challenges + 1 } }));
    setAiNote(null);
    if (await aiAvailable()) {
      fetch('/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: item.prompt, answer, direction }) })
        .then((r) => (r.ok ? r.json() : null)).then((j) => j?.text && setAiNote(j.text)).catch(() => {});
    }
  };
  const nextItem = () => { setI(i + 1); setText(''); setBuilt([]); setResult(null); setAiNote(null); };
  const shareCard = async () => {
    if (!result) return;
    const r = await shareText(`📝 Rate my translation\n“${item.prompt}” → “${answer}”\nScore: ${result.total}/100 · ${result.total >= 80 ? 'Certified no-cap translation ✅' : result.total >= 50 ? 'Low-key valid' : 'Cooked but learning 🍳'}\n— SlangStone`);
    if (r !== 'failed') toast(r === 'copied' ? 'Copied your result card' : 'Shared!');
  };

  return (
    <div className="stack">
      <div className="card" style={{ borderLeft: '6px solid var(--cyan)' }}>
        <div className="muted" style={{ fontWeight: 700 }}>Challenge {i + 1} · translate into {direction === 'en' ? 'slang' : 'plain English'}</div>
        <div className="prompt-text" style={{ marginTop: 6 }}>“{item.prompt}”</div>
      </div>

      {direction === 'en' && !result && (
        <div className="row" role="radiogroup" aria-label="How to answer">
          {([['type', '⌨️ Type it'], ['choose', '👆 Pick one'], ['build', '🧱 Build it']] as const).map(([id, label]) => (
            <button key={id} className="chip" role="radio" aria-checked={method === id} aria-pressed={method === id} onClick={() => setMethod(id)}>{label}</button>
          ))}
        </div>
      )}

      {!result && (method === 'type' || direction === 'slang') && (
        <textarea className="textarea" style={{ minHeight: 90 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={direction === 'en' ? 'Your slang version…' : 'In plain English…'} aria-label="Your translation" />
      )}
      {!result && method === 'choose' && direction === 'en' && (
        <div className="stack" style={{ gap: 10 }}>
          {choices.map((c) => <button key={c} className={`option ${text === c ? 'correct' : ''}`} onClick={() => setText(c)} aria-pressed={text === c}>{c}</button>)}
        </div>
      )}
      {!result && method === 'build' && direction === 'en' && (
        <div className="stack">
          <div className="output-box" style={{ minHeight: 60 }} aria-live="polite">{built.length ? built.map((b, k) => <button key={k} className="chip on" style={{ margin: 3 }} onClick={() => setBuilt(built.filter((_, j) => j !== k))} aria-label={`Remove ${b}`}>{b} ✕</button>) : <span className="muted">Tap pieces below to build your sentence.</span>}</div>
          <div className="row">{pieces.map((w) => <button key={w} className="chip" onClick={() => setBuilt([...built, w])}>{w}</button>)}</div>
        </div>
      )}

      {!result && <div><button className="btn primary" disabled={!answer.trim()} onClick={submit}>Score my translation</button></div>}

      {result && (
        <div className="stack">
          <div className="card pop-in">
            <div className="spread">
              <div><div className="muted small" style={{ fontWeight: 700 }}>YOUR ANSWER</div><div style={{ fontSize: '1.2rem', fontWeight: 600 }}>“{answer}”</div></div>
              <div className="big-number" style={{ fontSize: '3.5rem' }}>{result.total}</div>
            </div>
            <div className="grid two" style={{ marginTop: 12 }}>
              {([['Meaning preserved', result.meaning, 40], ['Naturalness', result.natural, 25], ['Tone', result.tone, 20], ['Creativity', result.creativity, 15]] as const).map(([label, v, max]) => (
                <div key={label}><div className="spread small"><span>{label}</span><span>{v}/{max}</span></div><div className="progress"><div style={{ width: `${(v / max) * 100}%` }} /></div></div>
              ))}
            </div>
            <div className="stack small" style={{ marginTop: 12 }}>
              {result.matched.length > 0 && <div>✅ Covered: {result.matched.join(', ')}</div>}
              {result.missing.length > 0 && <div>➕ Could also express: {result.missing.join(', ')} <span className="muted">(our rubric didn’t spot it — if you said it another way, that can still be valid!)</span></div>}
              {result.notes.map((n) => <div key={n} className="muted">💡 {n}</div>)}
            </div>
          </div>
          {aiNote && <div className="card flat"><div className="small muted" style={{ fontWeight: 700 }}>✨ AI EVALUATOR</div><p style={{ margin: 0 }}>{aiNote}</p></div>}
          <div className="card flat">
            <h3>Example answers</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{item.examples.map((e) => <li key={e}>{e}</li>)}</ul>
            <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>These aren’t the only correct answers — slang has many valid translations.</p>
          </div>
          <div className="btn-row">
            <button className="btn primary" onClick={nextItem}>Next challenge →</button>
            <button className="btn" onClick={() => setResult(null)}>Try again</button>
            <button className="btn" onClick={shareCard}>📤 Share “Rate my translation”</button>
          </div>
        </div>
      )}
    </div>
  );
}
