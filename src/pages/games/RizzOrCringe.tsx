import { useEffect, useMemo, useRef, useState } from 'react';
import { play, playRight, playWrong } from '../../lib/sfx';
import { GameShell, type GameResult } from '../../components/game';
import { RIZZ_ITEMS, type Verdict } from '../../data/content';
import { rng, sample } from '../../engine/rng';
import { useProgress } from '../../lib/store';

const ROUNDS = 8;
const HARD_SECONDS = 12;
const VERDICTS: { id: Verdict; emoji: string; label: string }[] = [
  { id: 'smooth', emoji: '😎', label: 'Smooth' },
  { id: 'awkward', emoji: '😬', label: 'Awkward' },
  { id: 'funny', emoji: '😂', label: 'Funny' },
  { id: 'depends', emoji: '🤷', label: 'Depends on context' },
];
const labelOf = (v: Verdict) => VERDICTS.find((x) => x.id === v)!;

export default function RizzOrCringe() {
  return (
    <GameShell id="rizz-or-cringe" title="Rizz or Cringe?" emoji="😬" accent="var(--coral)" timed
      tagline="Smooth, awkward, funny — or does it depend? Judge the message."
      howTo={<>
        <p>Read the situation and the message, then give your verdict (keys 1–4 work). Exact verdict = 10 points. If the real answer is “depends” — or you pick “depends” — any other answer still earns 5, because context matters.</p>
        <p className="small">Easy shows a hint. Hard gives you {HARD_SECONDS} seconds per message (unless you’re in practice mode).</p>
      </>}
      play={({ difficulty, practice, seed, onFinish }) => <Run {...{ difficulty, practice, seed, onFinish }} />}
    />
  );
}

function Run({ difficulty, practice, seed, onFinish }: { difficulty: number; practice: boolean; seed: number; onFinish: (r: GameResult) => void }) {
  const { answer } = useProgress();
  const items = useMemo(() => sample(rng(seed), RIZZ_ITEMS, ROUNDS), [seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Verdict | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pts, setPts] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const limit = difficulty === 3 && !practice ? HARD_SECONDS : 0;
  const [left, setLeft] = useState(limit);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const item = items[i];
  const answered = picked !== null || timedOut;

  function choose(v: Verdict | null) {
    if (answered) return;
    const exact = v === item.verdict;
    const partial = v !== null && !exact && (item.verdict === 'depends' || v === 'depends');
    const p = exact ? 10 : partial ? 5 : 0;
    if (v === null) setTimedOut(true); else setPicked(v);
    setPts(p);
    setScore((s) => s + p);
    if (exact) setCorrect((c) => c + 1);
    answer(undefined, exact);
    if (exact) playRight(); else if (partial) play('coin'); else playWrong();
    window.setTimeout(() => nextBtn.current?.focus(), 30);
  }

  function next() {
    if (i + 1 >= items.length) { onFinish({ score, correct, total: items.length, missed: [], detail: councilLine(correct, items.length) }); return; }
    setI(i + 1); setPicked(null); setTimedOut(false); setPts(0);
  }

  // hard-mode timer
  useEffect(() => {
    if (!limit || answered) return;
    setLeft(limit);
    const start = Date.now();
    const iv = window.setInterval(() => {
      const remain = limit - (Date.now() - start) / 1000;
      setLeft(Math.max(0, remain));
      if (remain <= 0) { window.clearInterval(iv); setTimedOut(true); }
    }, 100);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, limit, answered]);

  // apply a timeout as a no-answer (once)
  const timeoutHandled = useRef(-1);
  useEffect(() => {
    if (timedOut && picked === null && timeoutHandled.current !== i) {
      timeoutHandled.current = i;
      answer(undefined, false);
      playWrong(true);
      setPts(0);
      window.setTimeout(() => nextBtn.current?.focus(), 30);
    }
  }, [timedOut, picked, i, answer]);

  // keys 1–4 pick
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= 4) { e.preventDefault(); choose(VERDICTS[n - 1].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const exact = picked === item.verdict;

  return (
    <div className="stack">
      <div className="hud">
        <span className="stat">{i + 1}/{items.length}</span>
        <span className="stat">⭐ {score}</span>
        {practice && <span className="stat">Practice</span>}
      </div>
      {limit > 0 && (
        <div className={`timer-bar ${left < limit * 0.3 ? 'low' : ''}`} role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
          <div style={{ width: `${(left / limit) * 100}%` }} />
        </div>
      )}
      <div className="card" style={{ borderLeft: '6px solid var(--accent, var(--coral))' }}>
        <div className="muted" style={{ fontWeight: 700, marginBottom: 10 }}>{item.setup}</div>
        <div className="card coral" style={{ display: 'inline-block', maxWidth: '100%', padding: '12px 16px', borderRadius: '20px 20px 20px 4px' }}>
          <div className="prompt-text" style={{ margin: 0 }}>{item.text}</div>
        </div>
        {difficulty === 1 && !answered && <p className="small muted" style={{ marginBottom: 0 }}>💡 Think: would this make the other person feel good?</p>}
      </div>
      <div className="grid two" style={{ gap: 10 }}>
        {VERDICTS.map((v, k) => {
          const isRight = answered && v.id === item.verdict;
          const isWrong = answered && picked === v.id && v.id !== item.verdict;
          return (
            <button key={v.id} className={`option ${isRight ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} disabled={answered} onClick={() => choose(v.id)}>
              <span className="key" aria-hidden="true">{k + 1}</span>
              <span>{v.emoji} {v.label}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`feedback ${exact ? '' : 'bad'}`} role="status">
          <strong>
            {timedOut && picked === null ? 'Time’s up! ' : exact ? 'Nailed the vibe! +10. ' : pts === 5 ? 'Context matters — +5 partial credit. ' : 'Not quite the vibe. '}
          </strong>
          It’s {labelOf(item.verdict).emoji} <strong>{labelOf(item.verdict).label}</strong>. {item.why}
        </div>
      )}
      {answered && (
        <div className="btn-row">
          <button ref={nextBtn} className="btn primary" onClick={next}>{i + 1 >= items.length ? 'See results' : 'Next →'}</button>
        </div>
      )}
    </div>
  );
}

function councilLine(correct: number, total: number) {
  const acc = correct / total;
  if (acc >= 0.85) return '🧑‍⚖️ The council has reviewed your rizz: certified smooth operator.';
  if (acc >= 0.6) return '🧑‍⚖️ The council has reviewed your rizz: solid vibes, minor cringe.';
  if (acc >= 0.35) return '🧑‍⚖️ The council has reviewed your rizz: still loading…';
  return '🧑‍⚖️ The council has reviewed your rizz: please study the vibes and return.';
}
