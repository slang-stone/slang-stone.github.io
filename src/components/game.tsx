import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BY_ID } from '../data';
import type { Difficulty, MCQ } from '../engine/questions';
import { href } from '../lib/router';
import { shareText } from '../lib/share';
import { useProgress } from '../lib/store';
import { useOpenTerm, useToast } from './ui';
import { SoundToggle } from './settings';
import { play as playSfx, playRight, playWrong } from '../lib/sfx';

export interface GameResult { score: number; correct: number; total: number; missed: string[]; detail?: string }
export interface PlayProps { difficulty: Difficulty; practice: boolean; seed: number; onFinish: (r: GameResult) => void }

interface ShellProps {
  id: string;
  title: string;
  emoji: string;
  accent: string; // css color var, e.g. 'var(--coral)'
  tagline: string;
  howTo: ReactNode;
  timed?: boolean; // shows the practice (untimed) toggle
  play: (p: PlayProps) => ReactNode;
}

const DIFF_LABEL: Record<Difficulty, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

/** Shared frame for every game: setup → play → results, with personal bests and sharing. */
export function GameShell({ id, title, emoji, accent, tagline, howTo, timed, play }: ShellProps) {
  const { p, finishGame, addXP } = useProgress();
  const [phase, setPhase] = useState<'setup' | 'play' | 'done'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [practice, setPractice] = useState(false);
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const [result, setResult] = useState<GameResult | null>(null);
  const [newBest, setNewBest] = useState(false);
  const open = useOpenTerm();
  const toast = useToast();

  const onFinish = useCallback((r: GameResult) => {
    setResult(r);
    const isBest = practice ? false : finishGame(id, r.score);
    setNewBest(isBest);
    const acc = r.total ? r.correct / r.total : 0;
    window.setTimeout(() => playSfx(isBest && r.score > 0 ? 'newBest' : acc < 0.4 ? 'trombone' : 'tada'), 900);
    addXP(Math.round(r.score / 5) + 5);
    setPhase('done');
  }, [finishGame, addXP, id, practice]);

  const start = () => { setSeed(Date.now() % 100000); setPhase('play'); };
  const best = p.bests[id] ?? 0;

  return (
    <div style={{ ['--accent' as string]: accent }}>
      <div className="spread" style={{ marginBottom: 16 }}>
        <a className="btn sm ghost" href={href('games')}>← All games</a>
        <div className="hud"><SoundToggle /><span className="stat">🏆 Best: {best}</span></div>
      </div>

      {phase === 'setup' && (
        <div className="card" style={{ borderTop: `6px solid ${accent}` }}>
          <div style={{ fontSize: '3rem' }}>{emoji}</div>
          <h1>{title}</h1>
          <p className="muted" style={{ fontSize: '1.1rem' }}>{tagline}</p>
          <div className="card flat" style={{ marginBottom: 16 }}><h3>How to play</h3><div className="muted">{howTo}</div></div>
          <div className="stack">
            <div role="radiogroup" aria-label="Difficulty" className="row">
              <strong style={{ marginRight: 6 }}>Difficulty</strong>
              {([1, 2, 3] as Difficulty[]).map((d) => (
                <button key={d} className="chip" role="radio" aria-checked={difficulty === d} aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>{DIFF_LABEL[d]}</button>
              ))}
            </div>
            {timed && (
              <label className="row" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={practice} onChange={(e) => setPractice(e.target.checked)} />
                <span><strong>Practice mode</strong> <span className="muted">— no timer, no pressure, scores aren’t saved</span></span>
              </label>
            )}
            <div><button className="btn primary" onClick={start} autoFocus>Start {emoji}</button></div>
          </div>
        </div>
      )}

      {phase === 'play' && <div key={seed}>{play({ difficulty, practice, seed, onFinish })}</div>}

      {phase === 'done' && result && (
        <div className="card stack pop-in" style={{ borderTop: `6px solid ${accent}`, textAlign: 'center' }}>
          <div className="muted" style={{ fontWeight: 700 }}>{title} · {DIFF_LABEL[difficulty]}{practice ? ' · practice' : ''}</div>
          <div className="big-number">{result.score}</div>
          {newBest ? <div><span className="sticker">New personal best!</span></div> : !practice && <div className="muted">Personal best: {Math.max(best, result.score)}</div>}
          <div style={{ fontSize: '1.1rem' }}>
            {result.correct}/{result.total} correct · {result.total ? Math.round((result.correct / result.total) * 100) : 0}% accuracy
          </div>
          <div className="muted">{verdict(result)}</div>
          {result.detail && <div className="muted">{result.detail}</div>}
          {result.missed.length > 0 && (
            <div style={{ textAlign: 'left' }}>
              <h3>Review what you missed</h3>
              <div className="row">
                {[...new Set(result.missed)].map((tid) => BY_ID.get(tid)).filter(Boolean).map((t) => (
                  <button key={t!.id} className="chip" onClick={() => open(t!.id)}>{t!.term}</button>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: 8 }}>These are saved to “Words I keep forgetting” in the dictionary.</p>
            </div>
          )}
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={start}>Play again</button>
            <button className="btn" onClick={() => setPhase('setup')}>Change settings</button>
            <button className="btn" onClick={async () => {
              const r = await shareText(`${emoji} ${title}: ${result.score} pts (${result.correct}/${result.total}) on SlangStone. Bet you can't beat it.`);
              if (r !== 'failed') { toast(r === 'copied' ? 'Score copied — go flex it' : 'Shared!'); }
            }}>Share score</button>
          </div>
        </div>
      )}
    </div>
  );
}

function verdict(r: GameResult) {
  const acc = r.total ? r.correct / r.total : 0;
  if (acc >= 0.95) return 'Flawless. The council has reviewed your rizz and approves.';
  if (acc >= 0.8) return 'That was low-key fire.';
  if (acc >= 0.6) return 'Solid. Your slang license has been renewed.';
  if (acc >= 0.4) return 'Mid run, but you’re learning. Respect.';
  return 'Cooked… but learning. Check the missed words below.';
}

// ---------- reusable multiple-choice runner ------------------------------------------

export interface QuizConfig {
  next: (index: number) => MCQ | null; // null = no more questions
  practice: boolean;
  seconds?: (index: number) => number; // per-question timer (ignored in practice)
  lives?: number;
  base?: number;
  streakBonus?: number;
  speedBonus?: number;
  autoAdvance?: boolean; // speedrun: advance automatically after a correct answer
  onFinish: (r: GameResult) => void;
  renderPrompt?: (q: MCQ) => ReactNode;
  optionStyle?: 'list' | 'grid';
}

export function QuizRunner(cfg: QuizConfig) {
  const { answer } = useProgress();
  const [index, setIndex] = useState(0);
  const [q, setQ] = useState<MCQ | null>(() => cfg.next(0));
  const [picked, setPicked] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(cfg.lives ?? 0);
  const [missed, setMissed] = useState<string[]>([]);
  const limit = !cfg.practice && cfg.seconds ? cfg.seconds(index) : 0;
  const [left, setLeft] = useState(limit);
  const answered = picked !== null || timedOut;
  const nextBtn = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);

  const finish = useCallback((s: number, c: number, total: number, m: string[], bs: number) => {
    if (finished.current) return;
    finished.current = true;
    cfg.onFinish({ score: s, correct: c, total, missed: m, detail: bs > 1 ? `Longest streak: ${bs} 🔥` : undefined });
  }, [cfg]);

  // timer
  useEffect(() => {
    if (!limit || answered || !q) return;
    setLeft(limit);
    const start = Date.now();
    const iv = window.setInterval(() => {
      const remain = limit - (Date.now() - start) / 1000;
      setLeft(Math.max(0, remain));
      if (remain <= 0) { window.clearInterval(iv); resolve(null); }
    }, 100);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, q]);

  function resolve(choice: number | null) {
    if (!q || answered) return;
    const ok = choice !== null && q.correct.includes(choice);
    if (choice === null) setTimedOut(true); else setPicked(choice);
    answer(q.termId, ok);
    if (ok) playRight(streak + 1); else playWrong(choice === null);
    let s = score, st = streak, c = correct, lv = lives, m = missed;
    if (ok) {
      st = streak + 1;
      c = correct + 1;
      const speed = limit ? Math.round((left / limit) * (cfg.speedBonus ?? 0)) : 0;
      s = score + (cfg.base ?? 10) + Math.min(st - 1, 10) * (cfg.streakBonus ?? 2) + speed;
    } else {
      st = 0;
      if (q.termId) m = [...missed, q.termId];
      if (cfg.lives && !cfg.practice) lv = lives - 1;
    }
    setScore(s); setStreak(st); setBestStreak((b) => Math.max(b, st)); setCorrect(c); setLives(lv); setMissed(m);
    if (cfg.lives && !cfg.practice && lv <= 0) {
      window.setTimeout(() => finish(s, c, index + 1, m, Math.max(bestStreak, st)), 1400);
    } else if (ok && cfg.autoAdvance) {
      window.setTimeout(() => advance(), 700);
    } else {
      window.setTimeout(() => nextBtn.current?.focus(), 30);
    }
  }

  function advance() {
    if (cfg.lives && !cfg.practice && lives <= 0) return;
    const n = cfg.next(index + 1);
    if (!n) { finish(score, correct, index + 1, missed, bestStreak); return; }
    setIndex(index + 1); setQ(n); setPicked(null); setTimedOut(false);
  }

  // keyboard: 1–5 picks, Enter continues
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= q.options.length) { e.preventDefault(); resolve(n - 1); }
      else if (answered && (e.key === 'Enter' || e.key === ' ') && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!q) return <div className="card">No questions available for this setting. Try another difficulty or content mode.</div>;
  const ok = picked !== null && q.correct.includes(picked);

  return (
    <div className="stack">
      <div className="hud">
        <span className="stat">Q{index + 1}</span>
        <span className="stat">⭐ {score}</span>
        <span className="stat" aria-label={`Streak ${streak}`}>🔥 {streak}</span>
        {cfg.lives && !cfg.practice ? <span className="stat" aria-label={`${lives} lives left`}>{'❤️'.repeat(Math.max(lives, 0))}{'🖤'.repeat(Math.max(0, cfg.lives - lives))}</span> : null}
        {cfg.practice && <span className="stat">Practice</span>}
      </div>
      {limit > 0 && (
        <div className={`timer-bar ${left < limit * 0.3 ? 'low' : ''}`} role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
          <div style={{ width: `${(left / limit) * 100}%` }} />
        </div>
      )}
      <div className="card" style={{ borderLeft: '6px solid var(--accent, var(--lime))' }}>
        {q.sub && <div className="muted" style={{ fontWeight: 700, marginBottom: 6 }}>{q.sub}</div>}
        {cfg.renderPrompt ? cfg.renderPrompt(q) : <div className="prompt-text">{q.prompt}</div>}
      </div>
      <div className={cfg.optionStyle === 'grid' ? 'grid two' : 'stack'} style={{ gap: 10 }}>
        {q.options.map((o, i) => {
          const isRight = answered && q.correct.includes(i);
          const isWrong = answered && picked === i && !q.correct.includes(i);
          return (
            <button key={i} className={`option ${isRight ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} disabled={answered} onClick={() => resolve(i)}>
              <span className="key" aria-hidden="true">{i + 1}</span>
              <span>{o}</span>
              {isRight && <span style={{ marginLeft: 'auto' }} aria-label="correct">✅</span>}
              {isWrong && <span style={{ marginLeft: 'auto' }} aria-label="wrong">❌</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`feedback ${ok ? '' : 'bad'}`} role="status">
          <strong>{ok ? pickLine(true, index) : timedOut ? 'Time’s up! ' : pickLine(false, index)}</strong>{' '}
          {q.correct.length > 1 && <span className="muted">(More than one answer counts here.) </span>}
          {q.explain}
        </div>
      )}
      {answered && !(ok && cfg.autoAdvance) && !(cfg.lives && !cfg.practice && lives <= 0) && (
        <div className="btn-row">
          <button ref={nextBtn} className="btn primary" onClick={advance}>Next →</button>
          <button className="btn ghost" onClick={() => finish(score, correct, index + 1, missed, bestStreak)}>End game</button>
        </div>
      )}
      {cfg.lives && !cfg.practice && lives <= 0 && <div className="feedback bad">Out of lives — you’ve been cooked. Tallying your score…</div>}
    </div>
  );
}

const RIGHT = ['Correct! ', 'W! ', 'No cap, correct. ', 'You ate. ', 'Certified. ', 'Sheesh! '];
const WRONG = ['Not quite. ', 'L, but learn from it: ', 'Close-ish. ', 'Cooked on this one. '];
const pickLine = (ok: boolean, i: number) => (ok ? RIGHT : WRONG)[i % (ok ? RIGHT.length : WRONG.length)];
