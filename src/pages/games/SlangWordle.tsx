import { useEffect, useMemo, useRef, useState } from 'react';
import { play } from '../../lib/sfx';
import { GameShell, type GameResult } from '../../components/game';
import { useOpenTerm, useToast } from '../../components/ui';
import { BY_ID, gameTerms, type SlangTerm } from '../../data';
import { hashString, pick, rng } from '../../engine/rng';
import { todayKey } from '../../lib/dates';
import { shareText } from '../../lib/share';
import { storage } from '../../lib/storage';

const MAX = 6;
type Mark = 'hit' | 'near' | 'miss';
interface Candidate { word: string; id: string }

export default function SlangWordle() {
  return (
    <GameShell id="slang-wordle" title="Slang Wordle" emoji="🟩" accent="var(--lime)"
      tagline="One daily slang word. Six guesses. Same puzzle for everyone."
      howTo={<>
        <p>Guess today’s slang word in {MAX} tries. 🟩 = right letter, right spot. 🟨 = in the word, wrong spot. ⬛ = not in the word.</p>
        <p className="small">A new word drops at midnight UTC. Type on your keyboard or tap the on-screen keys. Difficulty doesn’t change the daily word.</p>
      </>}
      play={({ onFinish }) => <Run onFinish={onFinish} />}
    />
  );
}

/** Family-safe, letters-only words, sorted so the daily pick is stable for everyone. */
function candidates(): Candidate[] {
  const map = new Map<string, string>();
  for (const t of gameTerms('family')) {
    if (t.rating !== 'family' || t.confidence === 'low') continue;
    const w = t.term.toLowerCase();
    if (/^[a-z]{4,6}$/.test(w) && !map.has(w)) map.set(w, t.id);
    for (const v of t.variants) {
      const vw = v.toLowerCase();
      if (/^[a-z]{5}$/.test(vw) && !map.has(vw)) map.set(vw, t.id);
    }
  }
  return [...map.entries()].map(([word, id]) => ({ word, id })).sort((a, b) => (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
}

/** Standard Wordle marks with correct duplicate-letter handling. */
function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(guess.length).fill('miss');
  const counts: Record<string, number> = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) marks[i] = 'hit';
    else counts[answer[i]] = (counts[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'hit') continue;
    if (counts[guess[i]]) { marks[i] = 'near'; counts[guess[i]]--; }
  }
  return marks;
}

const EMOJI: Record<Mark, string> = { hit: '🟩', near: '🟨', miss: '⬛' };
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function Run({ onFinish }: { onFinish: (r: GameResult) => void }) {
  const date = todayKey();
  const key = `slang-wordle:${date}`;
  const list = useMemo(candidates, []);
  const daily = useMemo(() => (list.length ? list[hashString('wordle:' + date) % list.length] : null), [list, date]);
  const [dailyGuesses, setDailyGuesses] = useState<string[]>(() => {
    const saved = storage.get<unknown>(key, []);
    return Array.isArray(saved) ? saved.filter((g): g is string => typeof g === 'string' && g.length === (daily?.word.length ?? 0)).slice(0, MAX) : [];
  });
  const [practiceWord, setPracticeWord] = useState<Candidate | null>(null);
  const [practiceGuesses, setPracticeGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const reported = useRef(false);
  const open = useOpenTerm();
  const toast = useToast();

  const target = practiceWord ?? daily;
  const guesses = practiceWord ? practiceGuesses : dailyGuesses;
  const setGuesses = practiceWord ? setPracticeGuesses : setDailyGuesses;
  const n = target?.word.length ?? 5;
  const solved = !!target && guesses.includes(target.word);
  const over = solved || guesses.length >= MAX;
  const dailySolved = !!daily && dailyGuesses.includes(daily.word);
  const dailyOver = dailySolved || dailyGuesses.length >= MAX;

  useEffect(() => { if (!practiceWord) storage.set(key, dailyGuesses); }, [dailyGuesses, key, practiceWord]);

  const marks = useMemo(() => (target ? guesses.map((g) => score(g, target.word)) : []), [guesses, target]);
  const keyMarks = useMemo(() => {
    const rank: Record<Mark, number> = { miss: 0, near: 1, hit: 2 };
    const m: Record<string, Mark> = {};
    guesses.forEach((g, gi) => [...g].forEach((ch, i) => {
      const mk = marks[gi][i];
      if (!m[ch] || rank[mk] > rank[m[ch]]) m[ch] = mk;
    }));
    return m;
  }, [guesses, marks]);

  function type(ch: string) {
    if (over) return;
    setNote(null);
    setCurrent((c) => (c.length < n ? c + ch : c));
  }
  function back() { if (!over) { setNote(null); setCurrent((c) => c.slice(0, -1)); } }
  function submit() {
    if (over || !target) return;
    if (current.length !== n) {
      setNote(`Not enough letters — today’s word has ${n}.`);
      setShake(true); window.setTimeout(() => setShake(false), 350);
      play('buzzer');
      return;
    }
    const next = [...guesses, current];
    setGuesses(next);
    setCurrent('');
    if (current === target.word) { setNote(null); play('airhorn'); }
    else if (next.length >= MAX) { setNote(null); play('trombone'); }
    else { play('blip'); setNote('Any letters count — we don’t check a dictionary, so use guesses to hunt for letters.'); }
  }

  // physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (over || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Backspace') { e.preventDefault(); back(); }
      else if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); type(e.key.toLowerCase()); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!daily || !target) return <div className="card">No Wordle words are available right now. Check back soon!</div>;

  const term: SlangTerm | undefined = BY_ID.get(target.id);
  const usedCount = solved ? guesses.indexOf(target.word) + 1 : guesses.length;
  const dailyUsed = dailySolved ? dailyGuesses.indexOf(daily.word) + 1 : dailyGuesses.length;

  const shareGrid = async () => {
    const grid = dailyGuesses.map((g) => score(g, daily.word).map((m) => EMOJI[m]).join('')).join('\n');
    const r = await shareText(`Slang Wordle ${date} ${dailySolved ? dailyUsed : 'X'}/${MAX}\n\n${grid}`);
    if (r !== 'failed') toast(r === 'copied' ? 'Grid copied — no spoilers inside' : 'Shared!');
  };

  const seeScore = () => {
    if (reported.current) return;
    reported.current = true;
    onFinish({ score: dailySolved ? (7 - dailyUsed) * 10 : 0, correct: dailySolved ? 1 : 0, total: 1, missed: dailySolved ? [] : [daily.id], detail: `Slang Wordle ${date}: ${dailySolved ? dailyUsed : 'X'}/${MAX}` });
  };

  const startPractice = () => {
    const r = rng(Date.now() % 2147483647);
    const pool = list.filter((c) => c.word !== daily.word);
    setPracticeWord(pick(r, pool.length ? pool : list));
    setPracticeGuesses([]);
    setCurrent('');
    setNote(null);
  };

  const rows = Array.from({ length: MAX }, (_, ri) => {
    if (ri < guesses.length) return { letters: guesses[ri], marks: marks[ri], live: false };
    if (ri === guesses.length && !over) return { letters: current, marks: null, live: true };
    return { letters: '', marks: null, live: false };
  });

  return (
    <div className="stack">
      <div className="hud">
        <span className="stat">{practiceWord ? '🎲 Practice word' : `📅 ${date}`}</span>
        <span className="stat">Guess {Math.min(guesses.length + (over ? 0 : 1), MAX)}/{MAX}</span>
      </div>
      <p style={{ margin: 0, textAlign: 'center', fontWeight: 700 }}>
        {practiceWord ? `This practice word has ${n} letters` : `Today’s word has ${n} letters`}
      </p>
      <div className="wordle-grid" role="grid" aria-label="Guesses">
        {rows.map((row, ri) => (
          <div key={ri} role="row" className="wordle-row" style={{ ['--n' as string]: n, animation: row.live && shake ? 'shake 0.3s' : undefined }}>
            {Array.from({ length: n }, (_, ci) => {
              const ch = row.letters[ci] ?? '';
              const mk = row.marks?.[ci];
              return (
                <div key={ci} role="gridcell" className={`wordle-cell ${mk ?? ''}`}
                  aria-label={ch ? `${ch.toUpperCase()}${mk ? `, ${mk === 'hit' ? 'correct spot' : mk === 'near' ? 'wrong spot' : 'not in word'}` : ''}` : 'empty'}>
                  {ch.toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {note && <div className="feedback" role="status" style={{ borderLeftColor: 'var(--yellow)' }}>{note}</div>}

      {!over && (
        <div className="kbd" aria-label="On-screen keyboard">
          {ROWS.map((row, ri) => (
            <div key={row} className="kbd-row">
              {ri === 2 && <button type="button" className="wide" onMouseDown={(e) => e.preventDefault()} onClick={submit}>Enter</button>}
              {[...row].map((ch) => (
                <button key={ch} type="button" className={keyMarks[ch] ?? ''} onMouseDown={(e) => e.preventDefault()} onClick={() => type(ch)}
                  aria-label={`${ch}${keyMarks[ch] ? `, ${keyMarks[ch]}` : ''}`}>{ch}</button>
              ))}
              {ri === 2 && <button type="button" className="wide" onMouseDown={(e) => e.preventDefault()} onClick={back} aria-label="Backspace">⌫</button>}
            </div>
          ))}
        </div>
      )}

      {over && (
        <div className="card stack pop-in" style={{ borderTop: '6px solid var(--accent, var(--lime))' }} role="status">
          <div>
            <strong style={{ fontSize: '1.2rem' }}>{solved ? `Got it in ${usedCount}/${MAX}! ${usedCount <= 2 ? 'Absolutely goated.' : usedCount <= 4 ? 'You ate.' : 'Clutch.'}` : 'Cooked this time — here’s the word.'}</strong>
          </div>
          <div className="prompt-text" style={{ margin: 0 }}>{(term?.term ?? target.word)}{term && term.term.toLowerCase() !== target.word ? ` (${target.word})` : ''}</div>
          {term && <div className="muted">{term.definition}{term.example ? <> e.g. “{term.example}”</> : null}</div>}
          <div className="btn-row">
            <button className="btn" onClick={() => open(target.id)}>📖 Open in dictionary</button>
            {dailyOver && <button className="btn" onClick={shareGrid}>Share today’s grid</button>}
            {dailyOver && <button className="btn primary" onClick={seeScore} autoFocus>See score</button>}
            <button className="btn ghost" onClick={startPractice}>{practiceWord ? 'Another random word' : 'Practice with a random word'}</button>
            {practiceWord && <button className="btn ghost" onClick={() => { setPracticeWord(null); setCurrent(''); setNote(null); }}>Back to today’s puzzle</button>}
          </div>
          {practiceWord && <p className="small muted" style={{ margin: 0 }}>Practice rounds aren’t saved or scored.</p>}
          {!practiceWord && <p className="small muted" style={{ margin: 0 }}>Come back after midnight UTC for a new word.</p>}
        </div>
      )}
      {practiceWord && !over && (
        <div><button className="btn sm ghost" onClick={() => { setPracticeWord(null); setCurrent(''); setNote(null); }}>← Back to today’s puzzle</button></div>
      )}
    </div>
  );
}
