import { useEffect, useMemo, useState } from 'react';
import { gameTerms } from '../data';
import { PageHead, useOpenTerm, useToast } from '../components/ui';
import { audienceQ, definitionQ, meaningQ, pickTerms, sentenceQ, slangOrNonsenseQ, type MCQ } from '../engine/questions';
import { hashString, rng } from '../engine/rng';
import { addDays, msUntilNextUtcDay, todayKey } from '../lib/dates';
import { shareText } from '../lib/share';
import { playRight, playWrong } from '../lib/sfx';
import { storage } from '../lib/storage';
import { dailyBestStreak, dailyStreak, useProgress } from '../lib/store';

/**
 * Same 7 questions for everyone on a given UTC date: the seed is the date, and the pool is the
 * family-rated database regardless of content mode, so every player sees identical questions.
 */
export function dailyQuestions(date: string): MCQ[] {
  const r = rng(hashString(`daily:${date}`));
  const terms = gameTerms('family', 2);
  const picks = pickTerms(r, terms, 6);
  return [
    definitionQ(r, picks[0], terms),
    meaningQ(r, picks[1], terms),
    sentenceQ(r, picks[2], terms),
    definitionQ(r, picks[3], terms),
    audienceQ(r, picks[4]),
    meaningQ(r, picks[5], terms),
    slangOrNonsenseQ(r, terms, new Set(picks.map((t) => t.id))),
  ];
}

const LABELS: Record<string, string> = { definition: 'Guess the slang', meaning: 'Speed meaning', sentence: 'Translate it', audience: 'Who said that?', class: 'Slang or nonsense?' };

export default function Daily() {
  const today = todayKey();
  const { p, update, answer } = useProgress();
  const open = useOpenTerm();
  const toast = useToast();
  const qs = useMemo(() => dailyQuestions(today), [today]);
  const key = `daily-answers:${today}`;
  const [answers, setAnswers] = useState<(number | null)[]>(() => storage.get(key, [] as (number | null)[]));
  const [countdown, setCountdown] = useState(msUntilNextUtcDay());
  // answers are saved the moment you pick, so refreshing can't re-roll a question
  const [fb, setFb] = useState(false);
  const i = fb ? answers.length - 1 : answers.length;
  const done = answers.length >= qs.length && !fb;
  const score = answers.filter((a, k) => a !== null && qs[k].correct.includes(a)).length;

  useEffect(() => { storage.set(key, answers); }, [key, answers]);
  useEffect(() => { const t = window.setInterval(() => setCountdown(msUntilNextUtcDay()), 1000); return () => window.clearInterval(t); }, []);
  useEffect(() => {
    if (done && !p.daily[today]) {
      update((s) => ({ ...s, daily: { ...s.daily, [today]: { score, total: qs.length } }, xp: s.xp + 20 + score * 5 }));
    }
  }, [done, p.daily, today, score, qs.length, update]);

  const q = qs[Math.min(i, qs.length - 1)];
  const pending = fb ? answers[i] : null;
  const choose = (k: number) => {
    if (fb || done) return;
    setAnswers((a) => [...a, k]);
    setFb(true);
    answer(q.termId, q.correct.includes(k), 15);
    if (q.correct.includes(k)) playRight(); else playWrong();
  };
  const next = () => setFb(false);

  const best = Math.max(0, ...Object.values(p.daily).map((d) => d.score));
  const grid = answers.slice(0, done ? qs.length : 0).map((a, k) => (a !== null && qs[k].correct.includes(a) ? '🟩' : '🟥')).join('');
  const share = async () => {
    const r = await shareText(`Slang Translator Daily ${today}\n${grid} ${score}/${qs.length}\n🔥 streak ${dailyStreak(p)}`);
    if (r !== 'failed') toast(r === 'copied' ? 'Result copied — no spoilers inside' : 'Shared!');
  };
  const h = Math.floor(countdown / 3.6e6), m = Math.floor((countdown % 3.6e6) / 6e4), s = Math.floor((countdown % 6e4) / 1000);

  return (
    <div>
      <PageHead kicker={`Daily Challenge · ${today}`} title={done ? 'Challenge complete!' : 'Today’s 7 questions.'}>
        Everyone gets the same questions on the same day. New challenge at 00:00 UTC — refreshing won’t reset it.
      </PageHead>

      <div className="hud" style={{ marginBottom: 16 }}>
        <span className="stat">🔥 Streak {dailyStreak(p)}</span>
        <span className="stat">🏅 Best streak {dailyBestStreak(p)}</span>
        <span className="stat">⭐ Best score {best}/{qs.length}</span>
        <span className="stat">⏳ Next in {h}h {m}m {s}s</span>
      </div>

      {!done && (
        <div className="stack">
          <div className="progress"><div style={{ width: `${(answers.length / qs.length) * 100}%` }} /></div>
          <div className="card" style={{ borderLeft: '6px solid var(--purple)' }}>
            <div className="muted" style={{ fontWeight: 700 }}>Question {i + 1} of {qs.length} · {LABELS[q.kind]}</div>
            {q.sub && <div className="muted">{q.sub}</div>}
            <div className="prompt-text" style={{ marginTop: 6 }}>{q.prompt}</div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {q.options.map((o, k) => (
              <button key={k} className={`option ${pending !== null && q.correct.includes(k) ? 'correct' : ''} ${pending === k && !q.correct.includes(k) ? 'wrong' : ''}`} disabled={pending !== null} onClick={() => choose(k)}>
                <span className="key">{k + 1}</span><span>{o}</span>
              </button>
            ))}
          </div>
          {pending !== null && (
            <>
              <div className={`feedback ${q.correct.includes(pending) ? '' : 'bad'}`} role="status"><strong>{q.correct.includes(pending) ? 'Correct! ' : 'Not quite. '}</strong>{q.explain}</div>
              <div><button className="btn primary" onClick={next} autoFocus>{i + 1 === qs.length ? 'Finish' : 'Next →'}</button></div>
            </>
          )}
        </div>
      )}

      {done && (
        <div className="stack">
          <div className="card pop pop-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', letterSpacing: 4 }}>{grid}</div>
            <div className="big-number" style={{ color: 'var(--on-accent)' }}>{score}/{qs.length}</div>
            <div><span className="sticker">🏅 Daily badge earned</span></div>
            <p style={{ marginTop: 12 }}>{score === qs.length ? 'Perfect. Absolute cinema.' : score >= 5 ? 'W run. Your slang license has been renewed.' : 'Cooked but learning. Same time tomorrow?'}</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }} onClick={share}>📤 Share result</button>
            </div>
          </div>
          <div className="card">
            <h3>Review</h3>
            <div className="stack">
              {qs.map((qq, k) => {
                const a = answers[k];
                const ok = a !== null && a !== undefined && qq.correct.includes(a);
                return (
                  <div key={k} className={`feedback ${ok ? '' : 'bad'}`}>
                    <div style={{ fontWeight: 700 }}>{k + 1}. {qq.sub} {qq.prompt}</div>
                    <div className="small">Your answer: {a !== null && a !== undefined ? qq.options[a] : '—'} {ok ? '✅' : '❌'}</div>
                    {!ok && <div className="small">Answer: {qq.correct.map((c) => qq.options[c]).join(' / ')}</div>}
                    <div className="small muted">{qq.explain}</div>
                    {qq.termId && <button className="btn sm ghost" style={{ marginTop: 6 }} onClick={() => open(qq.termId!)}>Open entry</button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card flat section">
        <h3>Your last 5 weeks</h3>
        <Calendar done={new Set(Object.keys(p.daily))} today={today} />
      </div>
    </div>
  );
}

function Calendar({ done, today }: { done: Set<string>; today: string }) {
  const days = Array.from({ length: 35 }, (_, k) => addDays(today, k - 34));
  return (
    <>
      <div className="calendar" role="grid" aria-label="Completed daily challenges">
        {days.map((d) => (
          <div key={d} role="gridcell" className={`${done.has(d) ? 'done' : ''} ${d === today ? 'today' : ''}`} aria-label={`${d}${done.has(d) ? ' completed' : ''}`} title={d}>
            {Number(d.slice(8))}
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>Green = completed. Streaks are stored only on this device.</p>
    </>
  );
}
