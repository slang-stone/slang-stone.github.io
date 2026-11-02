import { useEffect, useMemo, useState } from 'react';
import { PageHead, Segments, useOpenTerm, useToast } from '../components/ui';
import { STYLES, type Style } from '../engine/rules';
import { alternatives, translate, type Direction, type TranslationResult } from '../engine/translate';
import { queryParam } from '../lib/router';
import { copyText, shareText } from '../lib/share';
import { useMode, useProgress } from '../lib/store';
import { aiAvailable, aiTranslate } from '../lib/ai';

const DIRS: { id: Direction; label: string }[] = [
  { id: 'en2slang', label: 'English → Slang' },
  { id: 'slang2en', label: 'Slang → English' },
  { id: 'slang2slang', label: 'Slang → Slang' },
];

const EXAMPLES: Record<Direction, string[]> = {
  en2slang: ['That was really impressive, and you did an excellent job.', 'I am so stressed about the exam.', 'Honestly, the pizza was delicious.', 'My friend took my fries and I lost it.', 'Stop talking so much and focus.'],
  slang2en: ['Bro is cooked, zero aura, absolutely no rizz.', 'ngl that fit is fire, no cap', 'She ate and left no crumbs fr fr', 'Lowkey mid tbh', 'Chat, am I cooked? That test was the final boss 💀'],
  slang2slang: ['That party was lit, on fleek, totes YOLO', 'Bro is cooked fr', 'Ngl that was mid'],
};

export default function Translator() {
  const mode = useMode();
  const { p, update } = useProgress();
  const toast = useToast();
  const open = useOpenTerm();
  const [dir, setDir] = useState<Direction>(() => (queryParam('dir') as Direction) || 'en2slang');
  const [text, setText] = useState(() => queryParam('text') ?? EXAMPLES.en2slang[0]);
  const [style, setStyle] = useState<Style>('genz');
  const [intensity, setIntensity] = useState(5);
  const [seed, setSeed] = useState(0);
  const [showWhy, setShowWhy] = useState(true);
  const [ai, setAi] = useState<{ available: boolean; text?: string; loading?: boolean; error?: string }>({ available: false });
  const [suggest, setSuggest] = useState({ text: '', meaning: '' });

  useEffect(() => { aiAvailable().then((available) => setAi((a) => ({ ...a, available }))); }, []);
  useEffect(() => { setAi((a) => ({ available: a.available })); }, [text, dir, style, intensity]);

  const opts = { direction: dir, style, intensity, mode, seed };
  const result: TranslationResult = useMemo(() => translate(text, opts), [text, dir, style, intensity, mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const alts = useMemo(() => (text.trim() && dir !== 'slang2en' ? alternatives(text, opts, 3) : []), [text, dir, style, intensity, mode, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  // count a translation once the user pauses typing
  useEffect(() => {
    if (!text.trim()) return;
    const t = window.setTimeout(() => update((s) => ({ ...s, stats: { ...s.stats, translations: s.stats.translations + 1 }, xp: s.xp + 2 })), 1200);
    return () => window.clearTimeout(t);
  }, [text, dir, style, intensity, seed, update]);

  const out = result.text;
  const tweak = (kind: 'natural' | 'funnier' | 'absurd') => {
    if (dir === 'slang2en') setDir('en2slang');
    if (kind === 'natural') { setStyle('natural'); setIntensity((i) => Math.max(1, Math.min(i, 4) - 1)); }
    if (kind === 'funnier') { setStyle(['dramatic', 'sarcastic', 'alpha'][seed % 3] as Style); setIntensity((i) => Math.min(10, i + 2)); }
    if (kind === 'absurd') { setStyle('brainrot'); setIntensity(10); }
    setSeed((s) => s + 1);
  };
  const translateBack = () => {
    setText(out.trim());
    setDir(dir === 'en2slang' ? 'slang2en' : dir === 'slang2en' ? 'en2slang' : 'slang2en');
  };
  const save = () => {
    update((s) => ({ ...s, saved: [{ id: `${Date.now()}`, input: text, output: out, direction: dir, style, at: new Date().toISOString() }, ...s.saved].slice(0, 100) }));
    toast('Saved to favorites. That translation was low-key fire.');
  };
  const share = async (lead = '') => {
    const r = await shareText(`${lead}“${text.trim()}”\n→ “${out.trim()}”\n— via Slang Translator`);
    if (r !== 'failed') { toast(r === 'copied' ? 'Copied — ready to paste' : 'Shared!'); update((s) => ({ ...s, stats: { ...s.stats, shares: s.stats.shares + 1 } })); }
  };
  const runAI = async () => {
    setAi((a) => ({ ...a, loading: true, error: undefined }));
    try {
      const res = await aiTranslate({ text, direction: dir, style, intensity, mode });
      setAi((a) => ({ ...a, loading: false, text: res }));
    } catch (e) {
      setAi((a) => ({ ...a, loading: false, error: (e as Error).message }));
    }
  };
  const submitSuggestion = async () => {
    const entry = { text: suggest.text.trim(), meaning: suggest.meaning.trim(), at: new Date().toISOString() };
    update((s) => ({ ...s, suggestions: [entry, ...s.suggestions].slice(0, 200) }));
    // Also send to the optional server review queue if it is running; ignore failures.
    fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => {});
    setSuggest({ text: '', meaning: '' });
    toast('Thanks! Queued for human review — nothing is published automatically.');
  };

  const showStyles = dir !== 'slang2en';

  return (
    <div>
      <PageHead kicker="Translator" title="Say it in slang. Or decode it.">
        Every translation is an approximation — slang depends on who’s talking, where, and how ironic they’re being.
      </PageHead>

      <div className="stack" style={{ gap: 18 }}>
        <div className="dir-toggle" role="group" aria-label="Translation direction">
          {DIRS.map((d) => <button key={d.id} aria-pressed={dir === d.id} onClick={() => { setDir(d.id); if (EXAMPLES.en2slang.includes(text) || EXAMPLES.slang2en.includes(text)) setText(EXAMPLES[d.id][0]); }}>{d.label}</button>)}
        </div>

        {showStyles && (
          <div className="card flat stack">
            <div className="row" role="radiogroup" aria-label="Style">
              {STYLES.map((s) => (
                <button key={s.id} className="chip" role="radio" aria-checked={style === s.id} aria-pressed={style === s.id} onClick={() => setStyle(s.id)} title={s.blurb}>{s.emoji} {s.label}</button>
              ))}
            </div>
            <label className="field">
              <span className="spread"><span>Intensity: {intensity}/10</span><span className="muted small">{intensity <= 2 ? 'Subtle — believable' : intensity <= 5 ? 'Casual' : intensity <= 8 ? 'Spicy' : 'Maximum chaos 🌀'}</span></span>
              <input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} aria-label="Slang intensity" />
            </label>
            {style === 'school' && <p className="small muted" style={{ margin: 0 }}>School Appropriate only uses family-rated terms, whatever the content mode.</p>}
          </div>
        )}

        <div className="grid two" style={{ alignItems: 'start' }}>
          <div className="stack">
            <label className="field">
              <span>{dir === 'en2slang' ? 'Plain English' : 'Slang'}</span>
              <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={dir === 'en2slang' ? 'Type something normal…' : 'Paste the confusing message…'} />
            </label>
            <div className="row small">
              <span className="muted">Try:</span>
              {EXAMPLES[dir].slice(0, 3).map((e) => <button key={e} className="chip" style={{ fontSize: '0.8rem' }} onClick={() => setText(e)}>{e.length > 28 ? `${e.slice(0, 28)}…` : e}</button>)}
            </div>
          </div>

          <div className="stack">
            <div className="spread">
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dir === 'slang2en' ? 'Plain English' : 'Slang'}</span>
              {text.trim() && <span className={`conf ${result.confidence}`}>Confidence: {result.confidence}</span>}
            </div>
            <div className="output-box" aria-live="polite">{text.trim() ? <Segments segments={result.segments} /> : <span className="muted">Your translation shows up here.</span>}</div>
            {text.trim() && (
              <div className="btn-row">
                <button className="btn sm" onClick={async () => { await copyText(out); toast('Copied. Certified no-cap translation.'); }}>📋 Copy</button>
                <button className="btn sm" onClick={() => share()}>📤 Share</button>
                <button className="btn sm" onClick={() => setSeed((s) => s + 1)}>🔄 Regenerate</button>
                <button className="btn sm" onClick={save}>💜 Save</button>
                <button className="btn sm" onClick={translateBack}>↩️ Translate back</button>
              </div>
            )}
          </div>
        </div>

        {text.trim() && (
          <div className="btn-row">
            <button className="btn" onClick={() => tweak('natural')}>🙂 More natural</button>
            <button className="btn" onClick={() => tweak('funnier')}>😂 Make it funnier</button>
            <button className="btn purple" onClick={() => tweak('absurd')}>🌀 Make it more absurd</button>
            <button className="btn" onClick={() => share('Send help, I need a translator: ')}>🆘 Send to someone who needs help</button>
            {ai.available && <button className="btn" onClick={runAI} disabled={ai.loading}>{ai.loading ? 'Thinking…' : '✨ AI polish'}</button>}
          </div>
        )}

        {(ai.text || ai.error) && (
          <div className="card flat">
            <div className="small muted" style={{ fontWeight: 700 }}>✨ AI SUGGESTION (approximate)</div>
            {ai.text && <p style={{ fontSize: '1.15rem', margin: '6px 0' }}>{ai.text}</p>}
            {ai.error && <p className="muted">{ai.error}</p>}
            <p className="small muted" style={{ margin: 0 }}>Your text was sent to this app’s server, which asks an AI model for a contextual translation. Don’t include personal information.</p>
          </div>
        )}

        {text.trim() && result.notes.length > 0 && (
          <div className="stack">{result.notes.map((n) => <div key={n} className="feedback" style={{ borderLeftColor: 'var(--cyan)' }}>{n}</div>)}</div>
        )}

        {result.explanations.length > 0 && (
          <div className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>Why this works</h3>
              <button className="btn sm ghost" onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy}>{showWhy ? 'Hide' : 'Show'}</button>
            </div>
            {showWhy && (
              <div className="stack" style={{ marginTop: 12 }}>
                {result.explanations.map((e) => (
                  <div key={e.term.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                    <button className="chip" onClick={() => open(e.term.id)} style={{ flex: 'none' }}>{e.surface}</button>
                    <div className="small"><div>{e.why}</div><div className="muted">{e.term.context}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {alts.length > 0 && (
          <div className="card flat">
            <h3>Alternative translations</h3>
            <div className="stack">
              {alts.map((a, i) => (
                <div key={i} className="spread" style={{ flexWrap: 'nowrap' }}>
                  <div style={{ fontSize: '1.05rem' }}><Segments segments={a.segments} /></div>
                  <button className="btn sm" style={{ flex: 'none' }} onClick={async () => { await copyText(a.text); toast('Copied!'); }} aria-label="Copy alternative">📋</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <details className="card flat">
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Didn’t recognise a word? Suggest it for review</summary>
          <form className="stack" style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); if (suggest.text.trim()) submitSuggestion(); }}>
            <input className="input" placeholder="The slang word or phrase" value={suggest.text} onChange={(e) => setSuggest({ ...suggest, text: e.target.value })} maxLength={80} />
            <input className="input" placeholder="What you think it means (optional)" value={suggest.meaning} onChange={(e) => setSuggest({ ...suggest, meaning: e.target.value })} maxLength={200} />
            <p className="small muted" style={{ margin: 0 }}>Suggestions are kept on this device (and sent to the app’s review queue if a server is running). A human checks every one before anything is added. Please don’t include names or personal info.</p>
            <div><button className="btn" type="submit" disabled={!suggest.text.trim()}>Submit suggestion</button></div>
          </form>
        </details>

        {p.saved.length > 0 && (
          <div className="card flat">
            <h3>Saved translations</h3>
            <div className="stack">
              {p.saved.slice(0, 8).map((s) => (
                <div key={s.id} className="spread" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                  <div className="small"><div className="muted">{s.input}</div><div style={{ fontWeight: 600 }}>{s.output}</div></div>
                  <button className="btn sm ghost" aria-label="Delete saved translation" onClick={() => update((st) => ({ ...st, saved: st.saved.filter((x) => x.id !== s.id) }))}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
