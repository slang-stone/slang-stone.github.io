import { useMemo } from 'react';
import { GameShell, QuizRunner } from '../../components/game';
import { audienceQ, pickTerms, pool } from '../../engine/questions';
import { rng } from '../../engine/rng';
import { useMode } from '../../lib/store';

export default function WhoSaidThat() {
  const mode = useMode();
  return (
    <GameShell id="who-said-that" title="Who Said That?" emoji="🕵️" accent="var(--purple)"
      tagline="Guess which crowd a phrase is most associated with."
      howTo={<>
        <p>Read the phrase and pick the group most likely to use it. Often more than one answer counts — generations overlap, and plenty of adults say “no cap” too.</p>
        <p className="small">These are rough patterns from our database, not rules about who people are.</p>
      </>}
      play={({ difficulty, seed, onFinish }) => <Run {...{ difficulty, seed, onFinish, mode }} />}
    />
  );
}

function Run({ difficulty, seed, onFinish, mode }: any) {
  const qs = useMemo(() => {
    const r = rng(seed);
    return pickTerms(r, pool(mode, difficulty), 8).map((t) => audienceQ(r, t));
  }, [seed, mode, difficulty]);
  return <QuizRunner next={(i) => qs[i] ?? null} practice base={10} streakBonus={2} onFinish={onFinish} />;
}
