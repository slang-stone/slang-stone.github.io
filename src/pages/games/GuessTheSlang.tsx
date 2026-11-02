import { useMemo } from 'react';
import { GameShell, QuizRunner } from '../../components/game';
import { definitionQ, pickTerms, pool } from '../../engine/questions';
import { rng } from '../../engine/rng';
import { useMode } from '../../lib/store';

const ROUNDS = 10;

export default function GuessTheSlang() {
  const mode = useMode();
  return (
    <GameShell id="guess-the-slang" title="Guess the Slang" emoji="🤔" accent="var(--cyan)" timed
      tagline="We give you the meaning. You name the slang. Simple, until it isn’t."
      howTo={<p>Read the definition and pick the slang term that matches. {ROUNDS} rounds, 20 seconds each. Streaks add bonus points; answering fast adds more. Keys 1–4 work too.</p>}
      play={({ difficulty, practice, seed, onFinish }) => <Run {...{ difficulty, practice, seed, onFinish, mode }} />}
    />
  );
}

function Run({ difficulty, practice, seed, onFinish, mode }: any) {
  const qs = useMemo(() => {
    const r = rng(seed);
    const terms = pool(mode, difficulty);
    return pickTerms(r, terms.filter((t) => t.difficulty === difficulty || difficulty === 1), ROUNDS).map((t) => definitionQ(r, t, terms));
  }, [seed, mode, difficulty]);
  return <QuizRunner next={(i) => qs[i] ?? null} practice={practice} seconds={() => 20} base={10} streakBonus={2} speedBonus={5} onFinish={onFinish} />;
}
