import { useMemo } from 'react';
import { GameShell, QuizRunner } from '../../components/game';
import { pickTerms, pool, sentenceQ } from '../../engine/questions';
import { rng } from '../../engine/rng';
import { useMode } from '../../lib/store';

const ROUNDS = 8;
const SECONDS = { 1: 25, 2: 18, 3: 12 } as const;

export default function TranslateOrCooked() {
  const mode = useMode();
  return (
    <GameShell id="translate-or-cooked" title="Translate or Be Cooked" emoji="🍳" accent="var(--coral)" timed
      tagline="A slang sentence drops. Decode it before the timer cooks you."
      howTo={<p>Pick the plain-English meaning of a real example sentence. The timer gets shorter on harder difficulties. After each round you get the explanation, so even wrong answers teach you something.</p>}
      play={({ difficulty, practice, seed, onFinish }) => <Run {...{ difficulty, practice, seed, onFinish, mode }} />}
    />
  );
}

function Run({ difficulty, practice, seed, onFinish, mode }: any) {
  const qs = useMemo(() => {
    const r = rng(seed);
    const terms = pool(mode, difficulty);
    return pickTerms(r, terms, ROUNDS).map((t) => sentenceQ(r, t, terms));
  }, [seed, mode, difficulty]);
  return (
    <QuizRunner next={(i) => qs[i] ?? null} practice={practice} seconds={() => SECONDS[difficulty as 1 | 2 | 3]} base={15} streakBonus={3} speedBonus={10} onFinish={onFinish}
      renderPrompt={(q) => <div className="prompt-text" style={{ fontStyle: 'italic' }}>💬 {q.prompt}</div>} />
  );
}
