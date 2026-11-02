import { useMemo, useRef } from 'react';
import { GameShell, QuizRunner } from '../../components/game';
import { pool, slangOrNonsenseQ } from '../../engine/questions';
import { rng } from '../../engine/rng';
import { useMode } from '../../lib/store';

export default function SlangOrNonsense() {
  const mode = useMode();
  return (
    <GameShell id="slang-or-nonsense" title="Slang or Nonsense?" emoji="🧪" accent="var(--lime)"
      tagline="Some of these are real. Some we made up five minutes ago."
      howTo={<>
        <p>Decide whether each phrase is established slang, current/emerging, old or fading, invented nonsense, or ambiguous. Ironic memes and words with several meanings accept “Ambiguous” too.</p>
        <p className="small">Invented phrases come from a separate, clearly labelled pool — they are never shown as real anywhere else in the app.</p>
      </>}
      play={({ difficulty, seed, onFinish }) => <Run {...{ difficulty, seed, onFinish, mode }} />}
    />
  );
}

function Run({ difficulty, seed, onFinish, mode }: any) {
  const r = useMemo(() => rng(seed), [seed]);
  const used = useRef(new Set<string>());
  const qs = useRef<ReturnType<typeof slangOrNonsenseQ>[]>([]);
  const terms = useMemo(() => pool(mode, difficulty), [mode, difficulty]);
  const next = (i: number) => {
    if (i >= 10) return null;
    qs.current[i] ??= slangOrNonsenseQ(r, terms, used.current);
    return qs.current[i];
  };
  return <QuizRunner next={next} practice base={10} streakBonus={2} onFinish={onFinish}
    renderPrompt={(q) => <div className="prompt-text" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>“{q.prompt}”</div>} />;
}
