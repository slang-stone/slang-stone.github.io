import { useState } from 'react';
import { BY_ID } from '../data';
import { PageHead, useOpenTerm, useToast } from '../components/ui';
import { ACHIEVEMENTS, dailyBestStreak, dailyStreak, learnedIds, levelOf, masteredIds, useProgress } from '../lib/store';
import { GAMES } from './games/registry';

export default function Stats() {
  const { p, reset } = useProgress();
  const open = useOpenTerm();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const lvl = levelOf(p.xp);
  const learned = learnedIds(p);
  const mastered = masteredIds(p);
  const acc = p.stats.answered ? Math.round((p.stats.right / p.stats.answered) * 100) : 0;
  const earned = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;

  const exportSuggestions = () => {
    const blob = new Blob([JSON.stringify(p.suggestions, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'slang-suggestions.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const chips = (ids: string[]) => ids.map((id) => BY_ID.get(id)).filter(Boolean).slice(0, 40).map((t) => (
    <button key={t!.id} className="chip" onClick={() => open(t!.id)}>{t!.term}</button>
  ));

  return (
    <div>
      <PageHead kicker="Hall of Fame" title={`Level ${lvl.level}: ${lvl.title}`}>
        Your progress lives only on this device. No account, no email, no tracking.
      </PageHead>

      <div className="card pop" style={{ marginBottom: 18 }}>
        <div className="spread"><strong>{p.xp} XP</strong><span>{lvl.need - lvl.into} XP to level {lvl.level + 1}</span></div>
        <div className="progress" style={{ marginTop: 8, background: 'rgba(0,0,0,.15)' }}><div style={{ width: `${(lvl.into / lvl.need) * 100}%`, background: 'var(--ink)' }} /></div>
      </div>

      <div className="grid auto">
        {[
          ['🎯', `${acc}%`, 'Accuracy'], ['✅', p.stats.right, 'Correct answers'], ['📚', learned.length, 'Words learned'], ['🏆', mastered.length, 'Words mastered'],
          ['🔥', dailyStreak(p), 'Daily streak'], ['🏅', dailyBestStreak(p), 'Best streak'], ['🔁', p.stats.translations, 'Translations'], ['🎮', p.stats.games, 'Games played'],
        ].map(([e, v, l]) => (
          <div key={l as string} className="card flat"><div style={{ fontSize: '1.6rem' }}>{e}</div><div className="big-number" style={{ fontSize: '2.4rem' }}>{v}</div><div className="muted small">{l}</div></div>
        ))}
      </div>

      <section className="section">
        <h2>Achievements <span className="muted" style={{ fontSize: '1rem' }}>{earned}/{ACHIEVEMENTS.length}</span></h2>
        <div className="grid auto">
          {ACHIEVEMENTS.map((a) => {
            const got = p.achievements[a.id];
            const prog = a.progress?.(p);
            return (
              <div key={a.id} className={`achievement ${got ? '' : 'locked'}`}>
                <span className="em" aria-hidden="true">{a.emoji}</span>
                <div style={{ flex: 1 }}>
                  <strong>{a.name}</strong>
                  <div className="small muted">{a.desc}</div>
                  {got ? <div className="small" style={{ color: 'var(--lime)' }}>Earned {got}</div> : prog && <div className="progress" style={{ marginTop: 6, height: 6 }}><div style={{ width: `${(prog[0] / prog[1]) * 100}%` }} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <h2>Personal bests</h2>
        <div className="grid auto">
          {[...GAMES, { id: 'slang-quiz', title: 'Slang Knowledge Quiz', emoji: '📝' }].map((g) => (
            <div key={g.id} className="card flat spread"><span>{g.emoji} {g.title}</span><strong>{p.bests[g.id] ?? '—'}</strong></div>
          ))}
        </div>
      </section>

      <section className="section grid two">
        <div className="card flat"><h3>🏆 Mastered</h3><p className="small muted">3+ correct answers each.</p><div className="row">{mastered.length ? chips(mastered) : <span className="muted">Keep playing to master words.</span>}</div></div>
        <div className="card flat"><h3>🧠 Keep forgetting</h3><p className="small muted">From questions you missed.</p><div className="row">{Object.keys(p.mistakes).length ? chips(Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]).map(([id]) => id)) : <span className="muted">Nothing yet. Suspiciously perfect.</span>}</div></div>
        <div className="card flat"><h3>💜 Favorites</h3><div className="row">{p.favorites.length ? chips(p.favorites) : <span className="muted">Tap 🤍 on any term.</span>}</div></div>
        <div className="card flat"><h3>🕑 Recently viewed</h3><div className="row">{p.recent.length ? chips(p.recent) : <span className="muted">Open a dictionary entry.</span>}</div></div>
      </section>

      <section className="section card flat stack">
        <h3>Your data</h3>
        <p className="muted" style={{ margin: 0 }}>{p.suggestions.length} term suggestion{p.suggestions.length === 1 ? '' : 's'} saved on this device. Teachers or maintainers can export them for review.</p>
        <div className="btn-row">
          <button className="btn" onClick={exportSuggestions} disabled={!p.suggestions.length}>⬇️ Export suggestions</button>
          {!confirming ? <button className="btn coral" onClick={() => setConfirming(true)}>Reset all progress</button> : (
            <>
              <button className="btn coral" onClick={() => { reset(); setConfirming(false); toast('Progress reset. Fresh spawn.'); }}>Yes, wipe everything</button>
              <button className="btn" onClick={() => setConfirming(false)}>Cancel</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
