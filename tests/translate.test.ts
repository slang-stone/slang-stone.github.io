import { describe, expect, it } from 'vitest';
import { translate, detectSlang, alternatives, splitSentences } from '../src/engine/translate';
import { RULES, TAGS, OPENERS } from '../src/engine/rules';
import { findTerm, TERMS, BY_ID } from '../src/data';

const en = (text: string, style: any = 'genz', intensity = 5, mode: any = 'teen', seed = 0) =>
  translate(text, { direction: 'en2slang', style, intensity, mode, seed });
const sl = (text: string, mode: any = 'teen') => translate(text, { direction: 'slang2en', style: 'natural', intensity: 1, mode });

describe('database', () => {
  it('has at least 300 unique terms', () => {
    expect(TERMS.length).toBeGreaterThanOrEqual(300);
    expect(BY_ID.size).toBe(TERMS.length);
  });
  it('every rule template term resolves to a dictionary entry', () => {
    const missing = new Set<string>();
    const templates = [...RULES.flatMap((r) => r.opts.map((o) => o.t)), ...Object.values(TAGS).flat(), ...Object.values(OPENERS).flat()];
    for (const t of templates) for (const m of t.matchAll(/\{([^{}|]+)(?:\|([^{}]+))?\}/g)) {
      const s = m[2] ?? m[1];
      if (!s.includes('$') && !findTerm(s) && !findTerm(m[1])) missing.add(s);
    }
    expect([...missing]).toEqual([]);
  });
});

describe('English → slang', () => {
  it('translates the flagship example while keeping structure', () => {
    const r = en('That was really impressive, and you did an excellent job.');
    expect(r.text).not.toContain('really impressive');
    expect(r.text).not.toContain('excellent job');
    expect(r.text).toMatch(/^That was .+, and .+/);
    expect(r.text.trim().endsWith('.')).toBe(true);
    expect(r.explanations.length).toBeGreaterThan(0);
  });
  it('is deterministic for a given seed and varies across seeds', () => {
    const a = en('That was really impressive.', 'genz', 6, 'teen', 1).text;
    expect(en('That was really impressive.', 'genz', 6, 'teen', 1).text).toBe(a);
    const alts = alternatives('That was really impressive, and you did an excellent job.', { direction: 'en2slang', style: 'genz', intensity: 6, mode: 'teen' });
    expect(alts.length).toBeGreaterThan(0);
  });
  it('intensity 1 natural stays subtle; 10 brain rot gets loud', () => {
    const calm = en('I am so stressed about the exam.', 'natural', 1);
    const wild = en('I am so stressed about the exam.', 'brainrot', 10);
    expect(wild.text.length).toBeGreaterThan(calm.text.length);
  });
  it('family mode never inserts teen or mature terms', () => {
    for (let seed = 0; seed < 40; seed++) {
      const r = en('Honestly, that test was really hard and he is in big trouble, my friend.', 'brainrot', 10, 'family', seed);
      for (const s of r.segments) if (s.term) expect(s.term.rating).toBe('family');
    }
  });
  it('fixes articles', () => {
    expect(en('That was a failure.', 'genz', 3).text).toMatch(/an L|a massive L|an epic fail|a canon event/);
  });
  it('preserves multiple sentences and line breaks', () => {
    const r = en('Good job.\nThe pizza was delicious!');
    expect(r.text.split('\n').length).toBe(2);
    expect(r.text).toMatch(/!/);
  });
  it('reports low confidence when nothing matched', () => {
    expect(en('The mitochondria synthesizes adenosine.', 'natural', 1).confidence).toBe('low');
  });
});

describe('slang → English', () => {
  it('handles the spec example', () => {
    const r = sl('Bro is cooked, zero aura, absolutely no rizz.');
    expect(r.text.toLowerCase()).toMatch(/^he is/);
    expect(r.text).not.toMatch(/\bcooked\b|\brizz\b|\baura\b/i);
    expect(r.matched).toBeGreaterThanOrEqual(2);
  });
  it('matches longer phrases before single words', () => {
    const hits = detectSlang('no cap that was fire');
    expect(hits[0].term.id).toBe('no-cap');
  });
  it('does not treat ordinary English as slang without context', () => {
    expect(detectSlang('I will read a book about the history of the fire department and carry it home.').length).toBe(0);
  });
  it('accepts ambiguous words when context supports it', () => {
    expect(detectSlang('that pizza was fire').map((h) => h.term.id)).toContain('fire');
  });
  it('understands abbreviations', () => {
    expect(sl('ngl tbh idk').text.toLowerCase()).toContain('honest');
  });
});

describe('slang → slang', () => {
  it('round-trips through English', () => {
    const r = translate('that party was lit, no cap', { direction: 'slang2slang', style: 'alpha', intensity: 6, mode: 'teen' });
    expect(r.text.length).toBeGreaterThan(0);
    expect(r.notes[0]).toMatch(/^Read as/);
  });
});

it('splits sentences without losing characters', () => {
  const s = 'Hi there! How are you?\nFine.';
  expect(splitSentences(s).join('')).toBe(s);
});
