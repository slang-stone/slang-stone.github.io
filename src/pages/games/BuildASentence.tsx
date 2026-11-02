import { useMemo, useState } from 'react';
import { playRight, playWrong } from '../../lib/sfx';
import { GameShell, type GameResult } from '../../components/game';
import { BUILD, type BuildScenario } from '../../data/content';
import { rng, sample, shuffle } from '../../engine/rng';
import { useProgress } from '../../lib/store';

const ROUNDS = 5;
const PASS = 60;
type Piece = BuildScenario['pieces'][number];

export default function BuildASentence() {
  return (
    <GameShell id="build-a-sentence" title="Build-a-Sentence" emoji="🧱" accent="var(--cyan)"
      tagline="Stack slang pieces into the perfect reply — without overdoing it."
      howTo={<>
        <p>Read the situation and the tone you’re going for. Tap pieces to add them to your sentence (tap again to remove), then hit “Send it”. Use 1–4 pieces.</p>
        <p className="small">Each piece has a fit score. You get a bonus for mixing two or more strong pieces, lose points for pieces with the wrong meaning, and lose a little for stuffing in extra slang. Easy hides most of the trap pieces.</p>
      </>}
      play={({ difficulty, seed, onFinish }) => <Run difficulty={difficulty} seed={seed} onFinish={onFinish} />}
    />
  );
}

/** Deterministic rubric. */
function rubric(pieces: Piece[]) {
  const sum = pieces.reduce((s, p) => s + p.fit, 0);
  const strong = pieces.filter((p) => p.fit >= 2).length;
  const zeros = pieces.filter((p) => p.fit === 0).length;
  const variety = strong >= 2 ? 3 : 0;
  const extra = Math.max(0, pieces.length - 3) * 2;
  return { sum, variety, zeroPenalty: zeros * 4, extra, total: Math.max(0, sum + variety - zeros * 4 - extra) };
}

/** Highest-scoring combo of 1..max pieces (ties → fewer pieces). */
function bestCombo(pieces: Piece[], max: number) {
  let best: Piece[] = [];
  let bestScore = -1;
  const n = pieces.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const combo = pieces.filter((_, i) => mask & (1 << i));
    if (combo.length > max) continue;
    const s = rubric(combo).total;
    if (s > bestScore || (s === bestScore && combo.length < best.length)) { best = combo; bestScore = s; }
  }
  return { pieces: best, score: Math.max(1, bestScore) };
}

function Run({ difficulty, seed, onFinish }: { difficulty: number; seed: number; onFinish: (r: GameResult) => void }) {
  const { answer } = useProgress();
  const maxPieces = difficulty === 1 ? 3 : 4;
  const rounds = useMemo(() => {
    const r = rng(seed);
    return sample(r, BUILD, Math.min(ROUNDS, BUILD.length)).map((s) => {
      let pieces = s.pieces;
      if (difficulty !== 3) {
        // easy keeps one trap piece, medium keeps two
        const keepZeros = difficulty === 1 ? 1 : 2;
        const zeros = shuffle(r, pieces.filter((p) => p.fit === 0)).slice(0, keepZeros);
        pieces = pieces.filter((p) => p.fit > 0 || zeros.includes(p));
      }
      return { ...s, pieces: shuffle(r, pieces) };
    });
  }, [seed, difficulty]);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lastNat, setLastNat] = useState(0);
  const round = rounds[i];
  const best = useMemo(() => bestCombo(round.pieces, maxPieces), [round, maxPieces]);
  const picked = chosen.map((k) => round.pieces[k]);
  const result = rubric(picked);

  const add = (k: number) => {
    if (sent || chosen.includes(k) || chosen.length >= maxPieces) return;
    setChosen([...chosen, k]);
  };
  const remove = (k: number) => { if (!sent) setChosen(chosen.filter((x) => x !== k)); };

  const send = () => {
    if (sent || !chosen.length) return;
    const nat = Math.min(100, Math.round((result.total / best.score) * 100));
    const ok = nat >= PASS;
    setLastNat(nat);
    setSent(true);
    setScore((s) => s + nat);
    if (ok) setCorrect((c) => c + 1);
    answer(undefined, ok);
    if (ok) playRight(); else playWrong();
  };

  const next = () => {
    if (i + 1 >= rounds.length) { onFinish({ score, correct, total: rounds.length, missed: [], detail: `Average naturalness: ${Math.round(score / rounds.length)}%` }); return; }
    setI(i + 1); setChosen([]); setSent(false);
  };

  const fitLabel = (f: number) => ['❌ wrong vibe', '🤏 odd but okay', '👍 good', '🔥 perfect'][f];

  return (
    <div className="stack">
      <div className="hud">
        <span className="stat">{i + 1}/{rounds.length}</span>
        <span className="stat">⭐ {score}</span>
        <span className="stat">Max {maxPieces} pieces</span>
      </div>
      <div className="card cyan">
        <div className="prompt-text" style={{ margin: 0 }}>{round.setup}</div>
        <div className="muted" style={{ marginTop: 6, fontWeight: 700 }}>Target tone: {round.tone}</div>
      </div>

      <div className="card flat">
        <div className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>Your sentence {chosen.length ? '(tap a piece to remove it)' : ''}</div>
        <div className="row" aria-live="polite" style={{ minHeight: 44 }}>
          {chosen.length === 0 && <span className="muted">Tap pieces below to build your reply…</span>}
          {chosen.map((k) => (
            <button key={k} type="button" className="chip on" disabled={sent} onClick={() => remove(k)} aria-label={`Remove “${round.pieces[k].text}”`}>
              {round.pieces[k].text}{!sent && ' ✕'}
            </button>
          ))}
        </div>
      </div>

      {!sent && (
        <>
          <div>
            <div className="small muted" style={{ fontWeight: 700, marginBottom: 8 }}>Pieces</div>
            <div className="row" role="group" aria-label="Available pieces">
              {round.pieces.map((p, k) => !chosen.includes(k) && (
                <button key={k} type="button" className="chip" onClick={() => add(k)} disabled={chosen.length >= maxPieces} aria-label={`Add “${p.text}”`}>
                  {p.text}
                </button>
              ))}
            </div>
            {chosen.length >= maxPieces && <p className="small muted">That’s the max — remove a piece to swap it.</p>}
          </div>
          <div><button className="btn primary" onClick={send} disabled={!chosen.length}>Send it 📨</button></div>
        </>
      )}

      {sent && (
        <div className={`feedback ${lastNat >= PASS ? '' : 'bad'}`} role="status">
          <div className="spread">
            <strong>{lastNat >= 90 ? 'Sounds totally natural. You ate.' : lastNat >= PASS ? 'Solid reply — that works.' : lastNat >= 30 ? 'Kinda mixed signals.' : 'Oof, that one doesn’t land.'}</strong>
            <span style={{ fontWeight: 800 }}>+{lastNat}</span>
          </div>
          <div style={{ margin: '10px 0' }}>
            <div className="small muted">Naturalness: {lastNat}/100</div>
            <div className="timer-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lastNat} aria-label="Naturalness">
              <div style={{ width: `${lastNat}%` }} />
            </div>
          </div>
          <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
            {picked.map((p) => <li key={p.text}><strong>{p.text}</strong> — {fitLabel(p.fit)} (+{p.fit}). {p.why}</li>)}
          </ul>
          <div className="small muted">
            Fit total {result.sum}
            {result.variety ? ` · +${result.variety} variety bonus` : ''}
            {result.zeroPenalty ? ` · −${result.zeroPenalty} wrong-vibe pieces` : ''}
            {result.extra ? ` · −${result.extra} too much slang` : ''}
            {' '}= {result.total} of a possible {best.score}
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>One strong combo:</strong> “{best.pieces.map((p) => p.text).join(' ')}”
            <div className="small muted">Multiple answers can work — this is just the highest-scoring mix of pieces.</div>
          </div>
        </div>
      )}
      {sent && <div><button className="btn primary" onClick={next} autoFocus>{i + 1 >= rounds.length ? 'See results' : 'Next →'}</button></div>}
    </div>
  );
}
