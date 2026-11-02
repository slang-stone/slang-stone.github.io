import { describe, expect, it } from 'vitest';
import { dailyQuestions } from '../src/pages/Daily';
import { scoreAnswer } from '../src/pages/Quiz';
import { EN_CHALLENGES, SLANG_CHALLENGES } from '../src/data/content';
import { gameTerms } from '../src/data';
import { definitionQ, meaningQ, sentenceQ } from '../src/engine/questions';
import { rng } from '../src/engine/rng';
import { streakFrom, addDays } from '../src/lib/dates';

describe('daily challenge', () => {
  it('is identical for the same date and different across dates', () => {
    const a = dailyQuestions('2026-11-01');
    expect(dailyQuestions('2026-11-01')).toEqual(a);
    expect(dailyQuestions('2026-11-02')).not.toEqual(a);
    expect(a).toHaveLength(7);
  });
  it('counts streaks across consecutive days', () => {
    const t = '2026-11-01';
    expect(streakFrom(new Set([t, addDays(t, -1), addDays(t, -2), addDays(t, -4)]), t)).toBe(3);
    expect(streakFrom(new Set([addDays(t, -1)]), t)).toBe(1);
  });
});

describe('question generators', () => {
  it('never use mature terms and always have distinct options with one valid answer', () => {
    const terms = gameTerms('unfiltered', 3);
    expect(terms.every((t) => t.rating !== 'mature')).toBe(true);
    const r = rng(42);
    for (const t of terms.slice(0, 120)) for (const make of [definitionQ, meaningQ, sentenceQ]) {
      const q = make(r, t, terms);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.correct).toHaveLength(1);
    }
  });
  it('family pool only has family-rated terms', () => {
    expect(gameTerms('family').every((t) => t.rating === 'family')).toBe(true);
  });
});

describe('challenge rubric', () => {
  it('rewards meaning and does not reward slang stuffing', () => {
    const pizza = EN_CHALLENGES[0];
    const good = scoreAnswer(pizza, 'That pizza was bussin fr', 'en');
    const stuffed = scoreAnswer(pizza, 'skibidi rizz bussin sigma aura cap fr ong', 'en');
    expect(good.total).toBeGreaterThan(stuffed.total);
    expect(good.matched.length).toBe(2);
  });
  it('scores plain-English answers for reverse challenges', () => {
    const s = scoreAnswer(SLANG_CHALLENGES[0], 'He is in big trouble, lost his cool, and has no charm.', 'slang');
    expect(s.missing).toEqual([]);
    expect(s.total).toBeGreaterThanOrEqual(80);
  });
});
