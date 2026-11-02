import { useMemo, useState } from 'react';
import { gameTerms, plainOf, termsFor } from '../data';
import { Segments, StatusBadge, useOpenTerm } from '../components/ui';
import { hashString, pick, rng } from '../engine/rng';
import { translate } from '../engine/translate';
import { todayKey } from '../lib/dates';
import { go, href } from '../lib/router';
import { dailyStreak, levelOf, useMode, useProgress } from '../lib/store';
import { GAMES } from './games/registry';
import { NAV } from '../lib/nav';
import { RosettaSection } from '../components/Rosetta';

const QUIPS = ['Bro, what does that even mean?', 'Translate this before your aura hits zero.', 'Certified no-cap translation.', 'Now fluent in yap.'];

export default function Home() {
  const mode = useMode();
  const { p } = useProgress();
  const open = useOpenTerm();
  const today = todayKey();
  const [q, setQ] = useState('');
  const [mystery, setMystery] = useState(0);
  const [reveal, setReveal] = useState(false);

  const dayR = useMemo(() => rng(hashString(`home:${today}`)), [today]);
  const word = useMemo(() => pick(dayR, gameTerms('family', 2)), [dayR]);
  const featured = useMemo(() => GAMES[hashString(today) % GAMES.length], [today]);
  const quip = QUIPS[hashString(today) % QUIPS.length];
  const mysteryTerm = useMemo(() => pick(rng(hashString(`m${today}${mystery}`)), gameTerms(mode, 2)), [mystery, mode, today]);
  const newer = useMemo(() => termsFor(mode).filter((t) => t.status === 'current' && /202[3-6]/.test(t.era ?? '') && t.confidence !== 'low').slice(0, 40), [mode]);
  const newerPick = useMemo(() => newer.filter((_, i) => (i + hashString(today)) % Math.max(1, Math.floor(newer.length / 8)) === 0).slice(0, 8), [newer, today]);
  const demo = useMemo(() => translate('That was really impressive, and you did an excellent job.', { direction: 'en2slang', style: 'genz', intensity: 6, mode, seed: 2 }), [mode]);
  const streak = dailyStreak(p);
  const doneToday = !!p.daily[today];
  const lvl = levelOf(p.xp);

  const surprise = () => {
    const r = rng(Date.now());
    const roll = r();
    if (roll < 0.5) open(pick(r, termsFor(mode)).id);
    else go(`games/${pick(r, GAMES).id}`);
  };

  return (
    <div className="stack" style={{ gap: 22 }}>
      <section className="hero">
        <div className="bubble" aria-hidden="true">💬</div>
        <div className="sticker" style={{ marginBottom: 14 }}>{quip}</div>
        <h1>Speak fluent internet.</h1>
        <p style={{ fontSize: '1.15rem', maxWidth: '46ch', opacity: 0.92 }}>
          Translate plain English into slang and back, look up {termsFor(mode).length}+ expressions, and play games that teach you what the kids are actually saying.
        </p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <a className="btn primary" href={href('translate?dir=en2slang')}>English → Slang</a>
          <a className="btn" style={{ background: '#fff', color: '#2a1a7a', borderColor: '#fff' }} href={href('translate?dir=slang2en')}>Slang → English</a>
          <button className="btn ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }} onClick={surprise}>🎲 Surprise me</button>
        </div>
        <form className="row" style={{ marginTop: 18, maxWidth: 520 }} onSubmit={(e) => { e.preventDefault(); go(`dictionary?q=${encodeURIComponent(q)}`); }} role="search">
          <label className="sr-only" htmlFor="home-search">Search the slang dictionary</label>
          <input id="home-search" className="input" style={{ flex: 1, background: 'rgba(255,255,255,.95)', color: '#15122b', borderColor: 'transparent' }} placeholder="Look up a word… (rizz, delulu, 6-7)" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn primary" type="submit">Search</button>
        </form>
      </section>

      <div className="card">
        <div className="small muted" style={{ fontWeight: 700 }}>LIVE DEMO</div>
        <div className="muted">“That was really impressive, and you did an excellent job.”</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: 6 }}>→ <Segments segments={demo.segments} /></div>
      </div>

      <div className="grid three">
        <div className="card pop">
          <div className="small" style={{ fontWeight: 800 }}>📌 WORD OF THE DAY</div>
          <h2 style={{ fontSize: '2.2rem', margin: '6px 0' }}>{word.term}</h2>
          <p style={{ margin: 0 }}>{word.definition}</p>
          <button className="btn sm" style={{ marginTop: 12, background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }} onClick={() => open(word.id)}>Full entry →</button>
        </div>
        <div className="card">
          <div className="small muted" style={{ fontWeight: 800 }}>❓ WHAT DOES THIS MEAN?</div>
          <h2 style={{ fontSize: '2rem', margin: '6px 0' }}>{mysteryTerm.term}</h2>
          {reveal ? (
            <p className="pop-in" style={{ margin: 0 }}><strong>{plainOf(mysteryTerm)}</strong> — <span className="muted">“{mysteryTerm.example}”</span></p>
          ) : (
            <p className="muted" style={{ margin: 0 }}>Think you know? Guess, then reveal.</p>
          )}
          <div className="btn-row" style={{ marginTop: 12 }}>
            {!reveal ? <button className="btn sm primary" onClick={() => setReveal(true)}>Reveal</button> : <button className="btn sm" onClick={() => open(mysteryTerm.id)}>Details</button>}
            <button className="btn sm" onClick={() => { setMystery((m) => m + 1); setReveal(false); }}>Another one</button>
          </div>
        </div>
        <div className="card purple">
          <div className="small" style={{ fontWeight: 800 }}>📅 DAILY CHALLENGE</div>
          <h2 style={{ margin: '6px 0' }}>{doneToday ? 'Done for today ✅' : '7 questions. 1 shot.'}</h2>
          <p className="muted" style={{ margin: 0 }}>
            🔥 {streak}-day streak{doneToday ? ` · today: ${p.daily[today].score}/${p.daily[today].total}` : ''}
          </p>
          <a className="btn sm" style={{ marginTop: 12, background: '#fff', color: '#2a1a7a', borderColor: '#fff' }} href={href('daily')}>{doneToday ? 'Review answers' : 'Start challenge'}</a>
        </div>
      </div>

      <a className={`card ${featured.color} game-tile`} href={href(`games/${featured.id}`)}>
        <div className="spread">
          <div>
            <div className="small" style={{ fontWeight: 800 }}>🎮 FEATURED GAME TODAY</div>
            <h2 style={{ margin: '6px 0' }}>{featured.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{featured.blurb}</p>
          </div>
          <div className="emoji" aria-hidden="true">{featured.emoji}</div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="btn sm" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>Play now</span>
          {p.bests[featured.id] ? <span className="small" style={{ fontWeight: 700 }}>Your best: {p.bests[featured.id]}</span> : null}
        </div>
      </a>

      <section>
        <div className="spread"><h2>Newer expressions</h2><a href={href('dictionary')} className="small">Full dictionary →</a></div>
        <p className="muted small">Terms our database marks as current and popularized roughly 2023–2026. That’s not a popularity ranking — slang moves fast and varies by place and group.</p>
        <div className="row">
          {newerPick.map((t) => (
            <button key={t.id} className="chip" onClick={() => open(t.id)}>{t.term} <StatusBadge status={t.status} /></button>
          ))}
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h3>Your progress</h3>
          <p className="muted" style={{ margin: 0 }}>Level {lvl.level} · {lvl.title} · {p.xp} XP</p>
          <div className="progress" style={{ margin: '10px 0' }}><div style={{ width: `${(lvl.into / lvl.need) * 100}%` }} /></div>
          <div className="row small muted">
            <span>🔥 Streak {streak}</span>
            <span>🏆 Best game score {Math.max(0, ...Object.values(p.bests))}</span>
            <span>💜 {p.favorites.length} favorites</span>
          </div>
        </div>
        <div className="card">
          <h3>Everything</h3>
          <div className="row">
            {NAV.slice(1).map((n) => <a key={n.path} className="chip" href={href(n.path)} style={{ textDecoration: 'none' }}>{n.icon} {n.label}</a>)}
          </div>
        </div>
      </section>

      <RosettaSection />
    </div>
  );
}
