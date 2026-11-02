// Question generators shared by the games, the Slang Quiz and the Daily Challenge.
// All questions come from verified database entries (confidence medium/high, never 'mature').
import { gameTerms, plainOf, type ContentMode, type SlangTerm } from '../data';
import { NONSENSE } from '../data/content';
import { sample, shuffle, type Rand } from './rng';

export type Difficulty = 1 | 2 | 3;

export interface MCQ {
  kind: string;
  prompt: string;
  sub?: string; // smaller line above/below the prompt
  options: string[];
  correct: number[]; // indexes accepted as correct (some questions accept several)
  explain: string;
  termId?: string;
}

export const pool = (mode: ContentMode, d: Difficulty) => gameTerms(mode, d);

/** Pick n terms, avoiding recently used ids when possible. */
export function pickTerms(r: Rand, terms: SlangTerm[], n: number, avoid: Set<string> = new Set()) {
  const fresh = terms.filter((t) => !avoid.has(t.id));
  return sample(r, fresh.length >= n ? fresh : terms, n);
}

function distractors(r: Rand, answer: SlangTerm, terms: SlangTerm[], n: number, key: (t: SlangTerm) => string) {
  const ansKey = key(answer).toLowerCase();
  const sameCat = terms.filter((t) => t.id !== answer.id && t.categories.some((c) => answer.categories.includes(c)));
  const others = terms.filter((t) => t.id !== answer.id);
  const out: SlangTerm[] = [];
  const seen = new Set([ansKey, plainOf(answer).toLowerCase()]);
  for (const t of [...shuffle(r, sameCat), ...shuffle(r, others)]) {
    const k = key(t).toLowerCase();
    if (seen.has(k) || seen.has(plainOf(t).toLowerCase())) continue;
    seen.add(k);
    seen.add(plainOf(t).toLowerCase());
    out.push(t);
    if (out.length === n) break;
  }
  return out;
}

function mcq(r: Rand, kind: string, prompt: string, answer: string, wrong: string[], explain: string, termId?: string, sub?: string): MCQ {
  const options = shuffle(r, [answer, ...wrong]);
  return { kind, prompt, sub, options, correct: [options.indexOf(answer)], explain, termId };
}

/** Definition → which slang? (Guess the Slang) */
export function definitionQ(r: Rand, t: SlangTerm, terms: SlangTerm[]): MCQ {
  const wrong = distractors(r, t, terms, 3, (x) => x.term).map((x) => x.term);
  return mcq(r, 'definition', t.definition, t.term, wrong, `“${t.term}” — ${t.definition} e.g. “${t.example}”`, t.id, 'Which slang means…');
}

/** Slang → what does it mean? (Speedrun) */
export function meaningQ(r: Rand, t: SlangTerm, terms: SlangTerm[]): MCQ {
  const wrong = distractors(r, t, terms, 3, (x) => plainOf(x)).map((x) => plainOf(x));
  return mcq(r, 'meaning', t.term, plainOf(t), wrong, `${t.term} = ${plainOf(t)}. ${t.definition}`, t.id, 'What does this mean?');
}

/** Slang sentence → English meaning (Translate or Be Cooked) */
export function sentenceQ(r: Rand, t: SlangTerm, terms: SlangTerm[]): MCQ {
  const wrong = distractors(r, t, terms, 3, (x) => x.exampleTranslation).map((x) => x.exampleTranslation);
  return mcq(r, 'sentence', `“${t.example}”`, t.exampleTranslation, wrong, `“${t.term}” here means ${plainOf(t)}. ${t.context}`, t.id, 'What does this actually mean?');
}

export const AUDIENCES = ['Younger kids / Gen Alpha', 'Teens / Gen Z', 'College / online culture', 'Older internet slang', 'Not enough information'] as const;

/** Who Said That? Accepts every audience the data supports, because generations overlap. */
export function audienceQ(_r: Rand, t: SlangTerm): MCQ {
  const ok = new Set<number>();
  if (t.generations.includes('alpha')) ok.add(0);
  if (t.generations.includes('z')) ok.add(1);
  if (t.categories.includes('college') || t.categories.includes('social-media') || t.generations.includes('millennial')) ok.add(2);
  if (t.generations.includes('older-internet') || t.status === 'throwback' || t.status === 'fading') ok.add(3);
  if (ok.size === 0 || t.generations.length >= 3) ok.add(4);
  const who = t.generations.length ? t.generations.map((g) => ({ alpha: 'Gen Alpha', z: 'Gen Z', millennial: 'millennials', 'older-internet': 'older internet users' }[g])).join(', ') : 'many groups';
  return {
    kind: 'audience', prompt: `“${t.example}”`, sub: `Who is most likely to say “${t.term}”?`, options: [...AUDIENCES], correct: [...ok], termId: t.id,
    explain: `“${t.term}” is associated with ${who}${t.status === 'throwback' ? ' and now feels like a throwback' : ''}. These are rough patterns — people of every age use slang differently.`,
  };
}

export const SLANG_CLASSES = ['Established slang', 'Current / emerging', 'Old or fading', 'Invented nonsense', 'Ambiguous / depends'] as const;

export function classOf(t: SlangTerm): number {
  if (t.status === 'established') return 0;
  if (t.status === 'current') return 1;
  if (t.status === 'fading' || t.status === 'throwback') return 2;
  return 4; // ironic, unverified
}

/** Slang or Nonsense? */
export function slangOrNonsenseQ(r: Rand, terms: SlangTerm[], used: Set<string>): MCQ {
  if (r() < 0.3) {
    const fresh = NONSENSE.filter((n) => !used.has(n));
    const phrase = (fresh.length ? fresh : NONSENSE)[Math.floor(r() * (fresh.length || NONSENSE.length))];
    used.add(phrase);
    return { kind: 'class', prompt: phrase, sub: 'Real slang or made up?', options: [...SLANG_CLASSES], correct: [3], explain: `We invented “${phrase}” for this game. It isn’t real slang (yet 👀).` };
  }
  const t = pickTerms(r, terms, 1, used)[0];
  used.add(t.id);
  const c = classOf(t);
  const correct = t.status === 'ironic' || t.meanings.length >= 2 ? [...new Set([c, 4])] : [c];
  return {
    kind: 'class', prompt: t.term, sub: 'Real slang or made up?', options: [...SLANG_CLASSES], correct, termId: t.id,
    explain: `Real! “${t.term}” = ${plainOf(t)}. Our database marks it as ${t.status === 'ironic' ? 'mostly ironic' : t.status}${correct.length > 1 ? ' — and its meaning shifts with context' : ''}.`,
  };
}
