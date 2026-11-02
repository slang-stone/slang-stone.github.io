// Slang database schema. Every term file in src/data/terms/*.json is an array of SlangTerm.
// Run `npm run data:validate` after editing data.

export type Category =
  | 'reactions' // Greetings and reactions
  | 'compliments'
  | 'roasts' // Insults and roasts
  | 'friendship'
  | 'dating'
  | 'school'
  | 'gaming'
  | 'food'
  | 'fashion' // Fashion and aesthetics
  | 'emotions'
  | 'approval' // Approval and agreement
  | 'disagreement'
  | 'memes' // Internet memes
  | 'brainrot'
  | 'texting' // Texting abbreviations
  | 'social-media'
  | 'entertainment' // Music and entertainment
  | 'college'
  | 'regional'
  | 'outdated'
  | 'sensitive'; // Adult or sensitive language

export type Status =
  | 'current' // in active, widespread use as of last verification
  | 'established' // long-lived, broadly understood
  | 'ironic' // mostly used ironically / as a meme
  | 'fading'
  | 'throwback'
  | 'unverified'; // unknown / needs verification

export type Generation = 'alpha' | 'z' | 'millennial' | 'older-internet';

/** family = fine for elementary kids; teen = rude/edgy but not explicit; mature = sexual/derogatory origins or profanity */
export type Rating = 'family' | 'teen' | 'mature';

export type PartOfSpeech =
  | 'noun' | 'verb' | 'adjective' | 'adverb' | 'interjection' | 'phrase' | 'abbreviation' | 'suffix';

export interface SlangTerm {
  id: string; // kebab-case, unique, e.g. "no-cap"
  term: string; // canonical display form, e.g. "no cap"
  variants: string[]; // alternate spellings, abbreviations, inflections, common misspellings (lowercase)
  pronunciation?: string; // only when useful, e.g. "GYAT (rhymes with 'that')"
  partOfSpeech: PartOfSpeech;
  definition: string; // short primary definition, original wording
  meanings: string[]; // additional meanings / senses (may be empty)
  plain: string; // drop-in plain-English equivalent used by the translator, e.g. "honestly" / "very good"
  example: string; // example sentence using the term
  exampleTranslation: string; // that sentence in plain English
  tone: 'positive' | 'negative' | 'neutral' | 'playful' | 'sarcastic' | 'mixed';
  context: string; // how/where it is typically used; caveats
  generations: Generation[];
  categories: Category[];
  era?: string; // approximate popularization period, hedged (e.g. "approx. 2022–2023"); omit if unsupported
  origin?: string; // cultural origin when supportable (credit AAVE, ballroom, gaming, etc.); hedge uncertainty
  related: string[]; // ids of related terms
  synonyms: string[]; // ids or plain strings
  opposites: string[];
  formality: 1 | 2 | 3 | 4 | 5; // 1 = very informal, 5 = fine in formal writing
  memeIntensity: 1 | 2 | 3 | 4 | 5; // 1 = normal word, 5 = pure meme brain rot
  difficulty: 1 | 2 | 3; // 1 = most people know it, 3 = niche
  status: Status;
  regions: string[]; // e.g. ["US"], ["UK"], ["US-Northeast"]; [] = widespread online
  rating: Rating;
  sensitiveNote?: string; // required when rating is teen/mature or the origin is sensitive
  mistakes?: string; // common usage mistakes
  sources: string[]; // URLs supporting the definition/origin
  lastVerified: string; // ISO date
  confidence: 'high' | 'medium' | 'low';
}
