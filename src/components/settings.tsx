import type { ContentMode } from '../data';
import { play, setSoundEnabled } from '../lib/sfx';
import { useProgress } from '../lib/store';

export function ModeSelect() {
  const { p, update } = useProgress();
  return (
    <label className="field small">
      <span className="muted">Content mode</span>
      <select className="select" value={p.settings.mode} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, mode: e.target.value as ContentMode } }))}>
        <option value="family">👨‍👩‍👧 Family Friendly</option>
        <option value="teen">🧑 Teen Mode</option>
        <option value="unfiltered">📚 Unfiltered Dictionary</option>
      </select>
    </label>
  );
}

export function ThemeToggle() {
  const { p, update } = useProgress();
  const dark = p.settings.theme === 'dark';
  return (
    <button className="btn sm" onClick={() => update((s) => ({ ...s, settings: { ...s.settings, theme: dark ? 'light' : 'dark' } }))} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}


export function SoundToggle({ small }: { small?: boolean }) {
  const { p, update } = useProgress();
  const on = p.settings.sound;
  return (
    <button className={`btn ${small ? 'sm' : 'sm'}`} aria-pressed={on} onClick={() => {
      update((s) => ({ ...s, settings: { ...s.settings, sound: !on } }));
      if (!on) { setSoundEnabled(true); play('ding'); }
    }} aria-label={on ? 'Mute game sounds' : 'Turn on game sounds'} title={on ? 'Mute meme sounds' : 'Turn on meme sounds'}>
      {on ? '🔊 Sound on' : '🔇 Sound off'}
    </button>
  );
}
