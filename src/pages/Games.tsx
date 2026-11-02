import { useState } from 'react';
import { ImagePicker } from '../components/ImagePicker';
import { SoundToggle } from '../components/settings';
import { PageHead } from '../components/ui';
import { href } from '../lib/router';
import { playRight, playWrong } from '../lib/sfx';
import { useProgress, type Progress } from '../lib/store';
import { GAMES } from './games/registry';

export default function Games() {
  const { p } = useProgress();
  return (
    <div>
      <PageHead kicker="Game Center" title="Ten ways to get fluent.">
        Every game pulls from the same verified slang database, saves your personal best on this device, and works with mouse, keyboard, or touch.
      </PageHead>
      <div className="grid auto">
        {GAMES.map((g) => (
          <a key={g.id} href={href(`games/${g.id}`)} className={`card ${g.color} game-tile`}>
            <div className="spread" style={{ alignItems: 'flex-start' }}>
              <span className="emoji" aria-hidden="true">{g.emoji}</span>
              {p.bests[g.id] ? <span className="badge" style={{ background: 'rgba(0,0,0,.18)', color: 'inherit' }}>Best {p.bests[g.id]}</span> : <span className="badge" style={{ background: 'rgba(0,0,0,.18)', color: 'inherit' }}>New</span>}
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>{g.title}</h3>
              <p className="muted" style={{ margin: 0 }}>{g.blurb}</p>
            </div>
          </a>
        ))}
      </div>
      <ReactionSettings />
    </div>
  );
}

type Settings = Progress['settings'];

function ReactionSettings() {
  const { p, update } = useProgress();
  const { reactions, reactRight, reactWrong } = p.settings;
  const [tab, setTab] = useState<'right' | 'wrong'>('right');
  const set = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const key = tab === 'right' ? 'reactRight' : 'reactWrong';
  const selected = tab === 'right' ? reactRight : reactWrong;
  const toggle = (id: string) => set({ [key]: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] } as Partial<Settings>);

  return (
    <section className="card section stack">
      <div className="spread">
        <h2 style={{ margin: 0 }}>🖼️ Reaction pics & sounds</h2>
        <SoundToggle />
      </div>
      <p className="muted" style={{ margin: 0 }}>A meme pic pops up in the corner when you get an answer right or wrong.</p>
      <div className="row" role="radiogroup" aria-label="Reaction pictures">
        {([['classic', '🖼️ Classic meme art'], ['mine', '📸 My own pics'], ['off', '🚫 Off']] as const).map(([id, label]) => (
          <button key={id} className="chip" role="radio" aria-checked={reactions === id} aria-pressed={reactions === id} onClick={() => set({ reactions: id })}>{label}</button>
        ))}
        {reactions !== 'off' && (
          <>
            <button className="btn sm" onClick={() => playRight()}>Test ✅</button>
            <button className="btn sm" onClick={() => playWrong()}>Test ❌</button>
          </>
        )}
      </div>
      {reactions === 'classic' && <p className="small muted" style={{ margin: 0 }}>Public-domain paintings that became memes (The Scream, Ducreux, Mona Lisa…), loaded from Wikimedia Commons.</p>}
      {reactions === 'mine' && (
        <div className="stack">
          <div className="dir-toggle" role="tablist" aria-label="Which reaction">
            <button role="tab" aria-selected={tab === 'right'} aria-pressed={tab === 'right'} onClick={() => setTab('right')}>✅ Right answer ({reactRight.length})</button>
            <button role="tab" aria-selected={tab === 'wrong'} aria-pressed={tab === 'wrong'} onClick={() => setTab('wrong')}>❌ Wrong answer ({reactWrong.length})</button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>Tap pictures to use them for {tab === 'right' ? 'right' : 'wrong'} answers — pick several and one shows at random.</p>
          <ImagePicker key={tab} selected={selected} onToggle={toggle} onAdded={(ids) => set({ [key]: [...selected, ...ids] } as Partial<Settings>)} label={tab === 'right' ? 'Right-answer pics' : 'Wrong-answer pics'} />
        </div>
      )}
    </section>
  );
}
