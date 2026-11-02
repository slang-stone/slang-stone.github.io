import { useMemo, useRef } from 'react';
import { GameShell, QuizRunner } from '../../components/game';
import { meaningQ, pool } from '../../engine/questions';
import { rng } from '../../engine/rng';
import { useMode } from '../../lib/store';

export default function SlangSpeedrun() {
  const mode = useMode();
  return (
    <GameShell id="slang-speedrun" title="Slang Speedrun" emoji="⚡" accent="var(--yellow)" timed
      tagline="Three lives. Shrinking timer. How far can you run?"
      howTo={<p>Terms fly at you — pick the meaning before the countdown ends. The timer shrinks every few rounds and harder words sneak in. Speed and streaks multiply your points. Lose all three ❤️ and the run is over.</p>}
      play={({ difficulty, practice, seed, onFinish }) => <Run {...{ difficulty, practice, seed, onFinish, mode }} />}
    />
  );
}

function Run({ difficulty, practice, seed, onFinish, mode }: any) {
  const r = useMemo(() => rng(seed), [seed]);
  const used = useRef(new Set<string>());
  const tiers = useMemo(() => [pool(mode, 1), pool(mode, 2), pool(mode, 3)], [mode]);
  const next = (i: number) => {
    // difficulty ramps up as the run goes on
    const tier = Math.min(2, difficulty - 1 + Math.floor(i / 8));
    const terms = tiers[tier];
    const fresh = terms.filter((t) => !used.current.has(t.id));
    const t = (fresh.length ? fresh : terms)[Math.floor(r() * (fresh.length || terms.length))];
    used.current.add(t.id);
    return meaningQ(r, t, terms);
  };
  const start = { 1: 9, 2: 7, 3: 5 }[difficulty as 1 | 2 | 3];
  return <QuizRunner next={next} practice={practice} lives={3} autoAdvance seconds={(i) => Math.max(2.5, start - Math.floor(i / 5) * 0.75)} base={10} streakBonus={3} speedBonus={10} onFinish={onFinish} optionStyle="grid"
    renderPrompt={(q) => <div className="prompt-text" style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)' }}>{q.prompt}</div>} />;
}
