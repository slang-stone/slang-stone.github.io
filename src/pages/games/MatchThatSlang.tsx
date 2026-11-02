import { useEffect, useMemo, useRef, useState } from 'react';
import { playRight, playWrong } from '../../lib/sfx';
import { GameShell, type GameResult } from '../../components/game';
import { plainOf, type ContentMode, type SlangTerm } from '../../data';
import { pool, type Difficulty } from '../../engine/questions';
import { rng, shuffle, type Rand } from '../../engine/rng';
import { useMode, useProgress } from '../../lib/store';

const SECONDS = 60;
const PRACTICE_BOARDS = 2;
const PAIRS: Record<Difficulty, number> = { 1: 6, 2: 7, 3: 8 };

export default function MatchThatSlang() {
  const mode = useMode();
  return (
    <GameShell id="match-that-slang" title="Match That Slang" emoji="🧩" accent="var(--lime)" timed
      tagline="Pair every slang word with its meaning. Combos stack."
      howTo={<>
        <p>Tap a slang term, then tap its meaning (or the other way round). On a computer you can also drag a term onto a meaning, or use Tab + Enter.</p>
        <p>+10 per match, +5 × combo for back-to-back matches, +25 for clearing a board. You have {SECONDS} seconds — clear a board and a new one is dealt. Practice mode: two untimed boards with example sentences.</p>
      </>}
      play={({ difficulty, practice, seed, onFinish }) => <Run {...{ difficulty, practice, seed, onFinish, mode }} />}
    />
  );
}

interface Board { terms: SlangTerm[]; meanings: SlangTerm[] }
type Sel = { side: 'term' | 'meaning'; id: string } | null;

/** Deal n terms whose plain meanings are all distinct, preferring ones not used yet. */
function deal(r: Rand, terms: SlangTerm[], n: number, used: Set<string>): Board {
  const out: SlangTerm[] = [];
  const seen = new Set<string>();
  const fresh = terms.filter((t) => !used.has(t.id));
  for (const t of [...shuffle(r, fresh), ...shuffle(r, terms.filter((t) => used.has(t.id)))]) {
    const k = plainOf(t).toLowerCase();
    if (seen.has(k) || out.some((o) => o.id === t.id)) continue;
    seen.add(k);
    out.push(t);
    if (out.length === n) break;
  }
  out.forEach((t) => used.add(t.id));
  return { terms: out, meanings: shuffle(r, out) };
}

interface RunProps { difficulty: Difficulty; practice: boolean; seed: number; onFinish: (r: GameResult) => void; mode: ContentMode }

function Run({ difficulty, practice, seed, onFinish, mode }: RunProps) {
  const { answer } = useProgress();
  const r = useMemo(() => rng(seed), [seed]);
  const terms = useMemo(() => pool(mode, difficulty), [mode, difficulty]);
  const used = useRef(new Set<string>());
  const [board, setBoard] = useState<Board>(() => deal(r, terms, PAIRS[difficulty], used.current));
  const [boards, setBoards] = useState(1);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Sel>(null);
  const [miss, setMiss] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const [left, setLeft] = useState(SECONDS);
  const startedAt = useRef(Date.now());
  const finished = useRef(false);
  const cleared = done.size === board.terms.length && board.terms.length > 0;

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const secs = Math.round((Date.now() - startedAt.current) / 1000);
    onFinish({ score, correct, total: attempts, missed, detail: `Time: ${practice ? secs : Math.min(secs, SECONDS)}s · Best combo: ${bestCombo}` });
  };

  // 60-second clock across all boards
  useEffect(() => {
    if (practice) return;
    const iv = window.setInterval(() => {
      const remain = SECONDS - (Date.now() - startedAt.current) / 1000;
      setLeft(Math.max(0, remain));
      if (remain <= 0) window.clearInterval(iv);
    }, 200);
    return () => window.clearInterval(iv);
  }, [practice]);

  useEffect(() => {
    if (!practice && left <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  // timed mode: deal a fresh board as soon as one is cleared
  useEffect(() => {
    if (!cleared || practice || finished.current) return;
    const t = window.setTimeout(() => nextBoard(), 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared]);

  function nextBoard() {
    if (practice && boards >= PRACTICE_BOARDS) { finish(); return; }
    setBoard(deal(r, terms, PAIRS[difficulty], used.current));
    setBoards((b) => b + 1);
    setDone(new Set());
    setSel(null);
    setMsg(null);
  }

  function attempt(termId: string, meaningId: string) {
    if (finished.current || done.has(termId) || done.has(meaningId)) return;
    const ok = termId === meaningId;
    const term = board.terms.find((t) => t.id === termId)!;
    answer(termId, ok);
    if (ok) playRight(combo + 1); else playWrong();
    setAttempts((a) => a + 1);
    setSel(null);
    if (ok) {
      const c = combo + 1;
      const nextDone = new Set(done).add(termId);
      const clear = nextDone.size === board.terms.length;
      const pts = 10 + 5 * (c - 1) + (clear ? 25 : 0);
      setDone(nextDone);
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      setCorrect((n) => n + 1);
      setScore((s) => s + pts);
      setMsg({ text: `${term.term} = ${plainOf(term)} · +${pts}${c > 1 ? ` (combo ×${c})` : ''}${clear ? ' · Board cleared! +25' : ''}`, bad: false });
    } else {
      setCombo(0);
      setMissed((m) => [...m, termId]);
      setMiss([termId, 'm:' + meaningId]);
      window.setTimeout(() => setMiss([]), 400);
      setMsg({ text: `Not a match — combo reset. “${term.term}” doesn’t mean that.`, bad: true });
    }
  }

  function pick(side: 'term' | 'meaning', id: string) {
    if (done.has(id)) return;
    if (!sel || sel.side === side) { setSel(sel && sel.id === id && sel.side === side ? null : { side, id }); return; }
    if (side === 'meaning') attempt(sel.id, id); else attempt(id, sel.id);
  }

  const isSel = (side: 'term' | 'meaning', id: string) => sel?.side === side && sel.id === id;

  return (
    <div className="stack">
      <div className="hud">
        <span className="stat">Board {boards}{practice ? `/${PRACTICE_BOARDS}` : ''}</span>
        <span className="stat">⭐ {score}</span>
        <span className="stat" aria-label={`Combo ${combo}`}>🔥 ×{combo}</span>
        {practice ? <span className="stat">Practice</span> : <span className="stat">⏱ {Math.ceil(left)}s</span>}
      </div>
      {!practice && (
        <div className={`timer-bar ${left < SECONDS * 0.25 ? 'low' : ''}`} role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
          <div style={{ width: `${(left / SECONDS) * 100}%` }} />
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        {sel ? `Selected “${sel.side === 'term' ? board.terms.find((t) => t.id === sel.id)?.term : plainOf(board.terms.find((t) => t.id === sel.id)!)}” — now pick its partner.` : 'Pick a slang term or a meaning to start a pair.'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <div className="match-col" role="group" aria-label="Slang terms">
          {board.terms.map((t) => (
            <button key={t.id} type="button" draggable={!done.has(t.id)}
              className={`match-item ${isSel('term', t.id) ? 'selected' : ''} ${done.has(t.id) ? 'done' : ''} ${miss.includes(t.id) ? 'miss' : ''}`}
              aria-pressed={isSel('term', t.id)} disabled={done.has(t.id)}
              aria-label={done.has(t.id) ? `${t.term}, matched` : t.term}
              onClick={() => pick('term', t.id)}
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setSel({ side: 'term', id: t.id }); }}
              onDragEnd={() => setDragOver(null)}>
              {t.term}
            </button>
          ))}
        </div>
        <div className="match-col" role="group" aria-label="Meanings">
          {board.meanings.map((t) => (
            <button key={t.id} type="button"
              className={`match-item ${isSel('meaning', t.id) ? 'selected' : ''} ${done.has(t.id) ? 'done' : ''} ${miss.includes('m:' + t.id) ? 'miss' : ''} ${dragOver === t.id ? 'dragover' : ''}`}
              style={practice && done.has(t.id) ? { opacity: 1 } : undefined}
              aria-pressed={isSel('meaning', t.id)} disabled={done.has(t.id)}
              aria-label={done.has(t.id) ? `${plainOf(t)}, matched with ${t.term}` : plainOf(t)}
              onClick={() => pick('meaning', t.id)}
              onDragOver={(e) => { if (!done.has(t.id)) { e.preventDefault(); setDragOver(t.id); } }}
              onDragLeave={() => setDragOver((d) => (d === t.id ? null : d))}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) attempt(id, t.id); }}>
              {plainOf(t)}
              {practice && done.has(t.id) && (
                <span className="small muted" style={{ display: 'block', fontWeight: 400, marginTop: 4 }}>✅ {t.term}: “{t.example}”</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {msg && <div className={`feedback ${msg.bad ? 'bad' : ''}`} role="status" aria-live="polite">{msg.text}</div>}
      <div className="btn-row">
        {practice && cleared && <button className="btn primary" onClick={nextBoard} autoFocus>{boards >= PRACTICE_BOARDS ? 'See results' : 'Next board →'}</button>}
        <button className="btn ghost" onClick={finish}>End game</button>
      </div>
    </div>
  );
}
