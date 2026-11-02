import type { Rating, SlangTerm } from './types';
export type { SlangTerm, Rating, Category, Status, Generation } from './types';

// Every JSON file in ./terms is loaded automatically; add a file there to extend the database.
const files = import.meta.glob('./terms/*.json', { eager: true, import: 'default' }) as Record<string, SlangTerm[]>;

export const TERMS: SlangTerm[] = Object.values(files)
  .flat()
  .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));

export const BY_ID = new Map(TERMS.map((t) => [t.id, t]));

export const RATING_ORDER: Record<Rating, number> = { family: 0, teen: 1, mature: 2 };

export type ContentMode = 'family' | 'teen' | 'unfiltered';
const MODE_MAX: Record<ContentMode, number> = { family: 0, teen: 1, unfiltered: 2 };

export function allowed(t: SlangTerm, mode: ContentMode) {
  return RATING_ORDER[t.rating] <= MODE_MAX[mode];
}

export function termsFor(mode: ContentMode) {
  return TERMS.filter((t) => allowed(t, mode));
}

/** Terms safe to use in games: allowed by mode and never 'mature' (no slurs/explicit terms as rewards). */
export function gameTerms(mode: ContentMode, difficulty?: 1 | 2 | 3) {
  return TERMS.filter(
    (t) => allowed(t, mode) && t.rating !== 'mature' && t.confidence !== 'low' && (!difficulty || t.difficulty <= difficulty),
  );
}

export const norm = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[‘’']/g, "'").replace(/\s+/g, ' ').trim();

/** Short drop-in English equivalent of a term (first option of `plain`). */
export function plainOf(t: SlangTerm) {
  return t.plain.split(/\s+\/\s+|;/)[0].trim();
}

/** Every surface form (term + variants) → term, lowercased. */
export const SURFACE = new Map<string, SlangTerm>();
for (const t of TERMS) {
  for (const s of [t.term, ...t.variants]) {
    const k = norm(s);
    if (k && !SURFACE.has(k)) SURFACE.set(k, t);
  }
}

export function findTerm(surface: string) {
  return SURFACE.get(norm(surface)) ?? BY_ID.get(norm(surface).replace(/[^a-z0-9]+/g, '-'));
}
