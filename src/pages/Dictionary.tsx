import { useMemo, useState } from 'react';
import { BY_ID, norm, plainOf, termsFor, type SlangTerm } from '../data';
import { PageHead, TermCard, categoryLabel, genLabel, statusLabel, useOpenTerm } from '../components/ui';
import { queryParam } from '../lib/router';
import { useMode, useProgress } from '../lib/store';

const CATEGORIES = ['reactions', 'compliments', 'roasts', 'friendship', 'dating', 'school', 'gaming', 'food', 'fashion', 'emotions', 'approval', 'disagreement', 'memes', 'brainrot', 'texting', 'social-media', 'entertainment', 'college', 'regional', 'outdated', 'sensitive'];
const STATUSES = ['current', 'established', 'ironic', 'fading', 'throwback', 'unverified'];
const GENS = ['alpha', 'z', 'millennial', 'older-internet'];
const LETTERS = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Edit distance ≤ 1 — catches common misspellings like "rizzz" or "delulo". */
function nearMatch(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Relevance score for a query; 0 = no match. */
function score(t: SlangTerm, q: string) {
  if (!q) return 1;
  const forms = [t.term, ...t.variants].map(norm);
  if (forms.includes(q)) return 100;
  if (forms.some((f) => f.startsWith(q))) return 80;
  if (forms.some((f) => f.includes(q))) return 60;
  if (q.length >= 4 && forms.some((f) => nearMatch(f, q))) return 50;
  if (norm(plainOf(t)).includes(q) || norm(t.definition).includes(q)) return 40;
  if (t.categories.some((c) => c.includes(q) || categoryLabel(c).toLowerCase().includes(q))) return 30;
  if (norm(t.example).includes(q) || t.meanings.some((m) => norm(m).includes(q))) return 20;
  if ([...t.related, ...t.synonyms].some((r) => r.replace(/-/g, ' ').includes(q))) return 10;
  return 0;
}

const firstLetter = (t: SlangTerm) => { const c = t.term.replace(/^[^a-z0-9]+/i, '')[0]?.toUpperCase() ?? '#'; return /[A-Z]/.test(c) ? c : '#'; };

export default function Dictionary({ letter: initialLetter }: { letter?: string }) {
  const mode = useMode();
  const { p } = useProgress();
  const open = useOpenTerm();
  const [q, setQ] = useState(() => queryParam('q') ?? '');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [gen, setGen] = useState('');
  const [diff, setDiff] = useState(0);
  const [formality, setFormality] = useState(0);
  const [minMeme, setMinMeme] = useState(0);
  const [harmless, setHarmless] = useState(mode === 'family');
  const [regional, setRegional] = useState(false);
  const [sort, setSort] = useState<'relevance' | 'az' | 'meme' | 'difficulty'>('relevance');
  const [letter, setLetter] = useState(initialLetter?.toUpperCase() ?? '');
  const [limit, setLimit] = useState(48);
  const [tab, setTab] = useState<'all' | 'favorites' | 'forgetting' | 'recent'>('all');

  const all = useMemo(() => termsFor(mode), [mode]);
  const nq = norm(q);

  const results = useMemo(() => {
    let list: SlangTerm[] =
      tab === 'favorites' ? p.favorites.map((id) => BY_ID.get(id)!).filter(Boolean)
      : tab === 'forgetting' ? Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]).map(([id]) => BY_ID.get(id)!).filter(Boolean)
      : tab === 'recent' ? p.recent.map((id) => BY_ID.get(id)!).filter(Boolean)
      : all;
    list = list.filter((t) => all.includes(t));
    const scored = list
      .map((t) => ({ t, s: score(t, nq) }))
      .filter(({ t, s }) =>
        s > 0 &&
        (!cat || t.categories.includes(cat as never)) &&
        (!status || t.status === status) &&
        (!gen || t.generations.includes(gen as never)) &&
        (!diff || t.difficulty === diff) &&
        (!formality || (formality === 1 ? t.formality <= 2 : formality === 2 ? t.formality === 3 : t.formality >= 4)) &&
        t.memeIntensity >= minMeme &&
        (!harmless || (t.rating === 'family' && !t.sensitiveNote)) &&
        (!regional || t.regions.length > 0) &&
        (!letter || firstLetter(t) === letter),
      );
    const by = {
      relevance: (a: typeof scored[0], b: typeof scored[0]) => b.s - a.s || a.t.term.localeCompare(b.t.term),
      az: (a: typeof scored[0], b: typeof scored[0]) => a.t.term.localeCompare(b.t.term, 'en', { sensitivity: 'base' }),
      meme: (a: typeof scored[0], b: typeof scored[0]) => b.t.memeIntensity - a.t.memeIntensity,
      difficulty: (a: typeof scored[0], b: typeof scored[0]) => a.t.difficulty - b.t.difficulty,
    }[tab === 'all' ? sort : 'relevance'];
    return scored.sort(by).map((x) => x.t);
  }, [all, nq, cat, status, gen, diff, formality, minMeme, harmless, regional, letter, sort, tab, p.favorites, p.mistakes, p.recent]);

  const lettersWithTerms = useMemo(() => new Set(all.map(firstLetter)), [all]);
  const reset = () => { setQ(''); setCat(''); setStatus(''); setGen(''); setDiff(0); setFormality(0); setMinMeme(0); setRegional(false); setLetter(''); };
  const random = () => { const pool = results.length ? results : all; open(pool[Math.floor(Math.random() * pool.length)].id); };

  return (
    <div>
      <PageHead kicker="Slang Dictionary" title={`${all.length} terms, decoded.`}>
        Original definitions with context, examples, and honest labels for what’s current, ironic, or fading.
        {mode === 'family' && ' Family Friendly mode hides terms with mature origins — switch modes in settings to see more.'}
      </PageHead>

      <div className="stack" style={{ gap: 14 }}>
        <div className="row" role="search">
          <label className="sr-only" htmlFor="dict-search">Search</label>
          <input id="dict-search" className="input" style={{ flex: '1 1 260px' }} placeholder="Search terms, meanings, examples, categories…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(48); }} autoFocus />
          <button className="btn" onClick={random}>🎲 Random word</button>
        </div>

        <div className="row" role="tablist" aria-label="Lists">
          {([['all', '📚 All'], ['favorites', `💜 Favorites (${p.favorites.length})`], ['forgetting', `🧠 Words I keep forgetting (${Object.keys(p.mistakes).length})`], ['recent', '🕑 Recently viewed']] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`chip ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <details className="card flat" open={typeof window !== 'undefined' && window.innerWidth > 900}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Filters & sorting</summary>
          <div className="grid auto" style={{ marginTop: 12, gap: 12 }}>
            <label className="field">Category<select className="select" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Any</option>{CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}</select></label>
            <label className="field">Currentness<select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any</option>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>
            <label className="field">Approx. audience<select className="select" value={gen} onChange={(e) => setGen(e.target.value)}><option value="">Anyone</option>{GENS.map((g) => <option key={g} value={g}>{genLabel(g)}</option>)}</select></label>
            <label className="field">Difficulty<select className="select" value={diff} onChange={(e) => setDiff(Number(e.target.value))}><option value={0}>Any</option><option value={1}>Easy — most people know it</option><option value={2}>Medium</option><option value={3}>Hard — niche</option></select></label>
            <label className="field">Formality<select className="select" value={formality} onChange={(e) => setFormality(Number(e.target.value))}><option value={0}>Any</option><option value={1}>Very casual</option><option value={2}>In between</option><option value={3}>Fine almost anywhere</option></select></label>
            <label className="field">Meme intensity ≥ {minMeme || 'any'}<input type="range" min={0} max={5} value={minMeme} onChange={(e) => setMinMeme(Number(e.target.value))} /></label>
            <label className="field">Sort by<select className="select" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="relevance">Best match</option><option value="az">A–Z</option><option value="meme">Most meme-y</option><option value="difficulty">Easiest first</option></select></label>
            <div className="stack" style={{ gap: 6 }}>
              <label className="row"><input type="checkbox" checked={harmless} onChange={(e) => setHarmless(e.target.checked)} /> Harmless only</label>
              <label className="row"><input type="checkbox" checked={regional} onChange={(e) => setRegional(e.target.checked)} /> Regional slang only</label>
              <button className="btn sm" onClick={reset}>Clear filters</button>
            </div>
          </div>
        </details>

        <nav className="az" aria-label="A to Z index">
          <button className={!letter ? 'on' : ''} onClick={() => setLetter('')} style={{ width: 'auto', padding: '0 10px' }}>All</button>
          {LETTERS.map((l) => <button key={l} className={letter === l ? 'on' : ''} disabled={!lettersWithTerms.has(l)} onClick={() => { setLetter(l); setLimit(200); }} aria-pressed={letter === l}>{l}</button>)}
        </nav>

        <div className="muted small" aria-live="polite">{results.length} result{results.length === 1 ? '' : 's'}</div>

        {results.length === 0 ? (
          <div className="card flat">
            <h3>No matches. Big yikes.</h3>
            <p className="muted">Try a different spelling, clear filters, or suggest the term from the Translator page so it can be reviewed.</p>
            {tab === 'forgetting' && <p className="muted">This list fills up from questions you miss in games and quizzes.</p>}
          </div>
        ) : (
          <div className="grid auto">{results.slice(0, limit).map((t) => <TermCard key={t.id} term={t} />)}</div>
        )}
        {results.length > limit && <div style={{ textAlign: 'center' }}><button className="btn" onClick={() => setLimit((l) => l + 48)}>Load more ({results.length - limit} left)</button></div>}
      </div>
    </div>
  );
}
