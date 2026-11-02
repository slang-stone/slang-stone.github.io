// Deterministic, offline translation engine.
//
// Pipeline (per sentence, original punctuation and spacing preserved):
//   English → slang : phrase rules (longest match first) → style/intensity pick → flourishes → a/an + caps cleanup
//   slang → English : context rules → dictionary match over all spellings (longest first, ambiguity guarded) → plain English
//   slang → slang   : slang → English, then English → slang in the target style
import { allowed, findTerm, norm, plainOf, SURFACE, type ContentMode, type SlangTerm } from '../data';
import { hashString, rng, weighted, type Rand } from './rng';
import { AMBIGUOUS, OPENERS, RULES, SLANG_TO_EN, STYLE_CODES, TAGS, type Rule, type RuleOption, type Style } from './rules';

export type Direction = 'en2slang' | 'slang2en' | 'slang2slang';

export interface TranslateOptions {
  direction: Direction;
  style: Style;
  intensity: number; // 1–10
  mode: ContentMode;
  seed?: number;
}

export interface Segment { text: string; term?: SlangTerm }
export interface Explanation { term: SlangTerm; surface: string; why: string }

export interface TranslationResult {
  input: string;
  text: string;
  segments: Segment[];
  explanations: Explanation[];
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
  matched: number; // phrases recognised
}

// ---------- helpers --------------------------------------------------------------------

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Split into sentences, keeping trailing punctuation + whitespace with each piece. */
export function splitSentences(text: string): string[] {
  return text.match(/[^.!?\n]+(?:[.!?]+["')\]]*)?\s*|\n+/g) ?? [text];
}

function styleCode(style: Style, intensity: number, r: Rand): string {
  if (style !== 'custom') return STYLE_CODES[style];
  // custom: intensity decides the flavour mix
  const pool = intensity <= 3 ? 'NNZW' : intensity <= 6 ? 'ZZAC' : intensity <= 8 ? 'ZAAB' : 'ABBB';
  return pool[Math.floor(r() * pool.length)];
}

const TEMPLATE_TERM = /\{([^{}|]+)(?:\|([^{}]+))?\}/g;

/** Resolve every {surface|id} in a template; return false if any term is above the content mode. */
function templateAllowed(t: string, mode: ContentMode) {
  for (const m of t.matchAll(TEMPLATE_TERM)) {
    const term = findTerm(m[2] ?? m[1]);
    if (term && !allowed(term, mode)) return false;
    if (term && mode === 'family' && term.rating !== 'family') return false;
  }
  return true;
}

function optionWeight(o: RuleOption, code: string, intensity: number, mode: ContentMode) {
  if (intensity < o.min || intensity > o.max) return 0;
  if (!templateAllowed(o.t, mode)) return 0;
  const styleW = o.s.includes(code) ? 4 : o.s === '*' ? 1.5 : 0.15;
  // stronger options (higher min) get favoured as intensity rises
  const intensityW = 1 + (o.min / 10) * (intensity / 3);
  return styleW * intensityW;
}

/** Turn a filled template ("you {ate} fr") into display segments. */
function toSegments(s: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of s.matchAll(TEMPLATE_TERM)) {
    if (m.index! > last) out.push({ text: s.slice(last, m.index) });
    const surface = m[1];
    out.push({ text: surface, term: findTerm(m[2] ?? surface) ?? findTerm(surface) });
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

const VOWEL_SOUND_LETTERS = 'AEFHILMNORSX';
function fixArticles(s: string) {
  return s.replace(/\b([Aa])(n?) (\{?)([A-Za-z+-][\w'-]*)/g, (_m, a: string, _n: string, brace: string, word: string) => {
    const single = /^[A-Z]$/.test(word);
    const vowel = single ? VOWEL_SOUND_LETTERS.includes(word) : /^[aeiou]/i.test(word) && !/^(uni|use|one|eu)/i.test(word);
    return `${a}${vowel ? 'n' : ''} ${brace}${word}`;
  });
}

function capitalizeFirst(s: string) {
  const i = s.search(/[A-Za-z]/);
  if (i < 0) return s;
  return s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
}

function explain(term: SlangTerm, surface: string): Explanation {
  return { term, surface, why: `“${surface}” → ${plainOf(term)}. ${term.definition}` };
}

function collectExplanations(segments: Segment[]) {
  const seen = new Set<string>();
  const out: Explanation[] = [];
  for (const s of segments) {
    if (s.term && !seen.has(s.term.id)) {
      seen.add(s.term.id);
      out.push(explain(s.term, s.text));
    }
  }
  return out;
}

const plainText = (segments: Segment[]) => segments.map((s) => s.text).join('');

// ---------- English → slang ------------------------------------------------------------

interface Hit { start: number; end: number; rule: Rule; m: RegExpExecArray }

function findHits(sentence: string): Hit[] {
  const hits: Hit[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(sentence))) {
      if (m[0].length === 0) { rule.re.lastIndex++; continue; }
      hits.push({ start: m.index, end: m.index + m[0].length, rule, m });
    }
  }
  // longest-match-first, then earliest
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const chosen: Hit[] = [];
  for (const h of hits) if (!chosen.some((c) => h.start < c.end && c.start < h.end)) chosen.push(h);
  return chosen.sort((a, b) => a.start - b.start);
}

function fill(template: string, m: RegExpExecArray) {
  return template.replace(/\$(\d)/g, (_x, d: string) => m[Number(d)] ?? '');
}

function englishSentenceToSlang(sentence: string, code: string, intensity: number, mode: ContentMode, r: Rand) {
  // keep user text from being read as template markup
  const safe = sentence.replace(/[{}]/g, '');
  const body = safe.replace(/\s+$/, '');
  const trailing = safe.slice(body.length);
  const punct = body.match(/[.!?]+["')\]]*$/)?.[0] ?? '';
  const core = body.slice(0, body.length - punct.length);
  if (!core.trim()) return { out: safe, matched: 0 };

  const hits = findHits(core);
  let out = '';
  let last = 0;
  let matched = 0;
  for (const h of hits) {
    const opt = weighted(r, h.rule.opts, (o) => optionWeight(o, code, intensity, mode));
    out += core.slice(last, h.start);
    let rep = opt ? fill(opt.t, h.m) : h.m[0];
    if (opt && opt.t !== '$0') matched++;
    if (h.start === 0 && /^[A-Z]/.test(core)) rep = capitalizeFirst(rep);
    out += rep;
    last = h.end;
  }
  out += core.slice(last);

  // flourishes scale with intensity; Natural and School styles stay restrained
  const damp = code === 'N' || code === 'K' ? 0.55 : code === 'W' ? 0.8 : 1;
  const eff = intensity * damp;
  const pickAllowed = (pool: string[]) => weighted(r, pool.filter((p) => templateAllowed(p, mode) && !out.includes(p)), () => 1);
  const opener = OPENERS[code] ?? [];
  if (opener.length && (eff >= 9 ? r() < 0.8 : eff >= 7 ? r() < 0.5 : eff >= 5 ? r() < 0.25 : false)) {
    const op = pickAllowed(opener);
    if (op) out = `${op} ${out.replace(/^([A-Z])(?![A-Z])/, (c) => c.toLowerCase())}`;
  }
  const tagCount = eff >= 9 ? 2 + (r() < 0.5 ? 1 : 0) : eff >= 7 ? 1 + (r() < 0.5 ? 1 : 0) : eff >= 5 ? (r() < 0.75 ? 1 : 0) : eff >= 3 ? (r() < 0.35 ? 1 : 0) : 0;
  for (let i = 0; i < tagCount; i++) {
    const tag = pickAllowed(TAGS[code] ?? TAGS.Z);
    if (!tag) break;
    out += /^[^\w{+]/u.test(tag) ? ` ${tag}` : `, ${tag}`;
  }
  out = fixArticles(out).replace(/\s{2,}/g, ' ').replace(/ ,/g, ',');
  return { out: capitalizeFirst(out) + punct + trailing, matched };
}

// ---------- slang → English ------------------------------------------------------------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let slangRe: RegExp | null = null;
function slangMatcher() {
  if (slangRe) return slangRe;
  const surfaces = [...SURFACE.keys()]
    .filter((s) => s.length > 0 && !s.includes('___') && !s.includes('...'))
    .sort((a, b) => b.length - a.length)
    .map(escapeRe);
  slangRe = new RegExp(`(?<![\\w'])(?:${surfaces.join('|')})(?![\\w'])`, 'giu');
  return slangRe;
}

export interface SlangHit { start: number; end: number; surface: string; term: SlangTerm; ambiguous: boolean }

/** Find slang in text. Ambiguous everyday words count only with supporting context. */
export function detectSlang(text: string, mode: ContentMode = 'unfiltered'): SlangHit[] {
  const re = slangMatcher();
  const normalized = text.replace(/[‘’]/g, "'");
  const raw: SlangHit[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized))) {
    const term = SURFACE.get(norm(m[0]));
    if (!term || !allowed(term, mode)) continue;
    // all-caps abbreviations typed in lowercase that are common words ("rn" is fine, "op" is risky)
    raw.push({ start: m.index, end: m.index + m[0].length, surface: text.slice(m.index, m.index + m[0].length), term, ambiguous: AMBIGUOUS.has(norm(m[0])) });
  }
  const words = text.trim().split(/\s+/).length;
  const strong = raw.filter((h) => !h.ambiguous).length;
  return raw.filter((h) => {
    if (!h.ambiguous) return true;
    if (words <= 4 || strong > 0) return true;
    const before = normalized.slice(Math.max(0, h.start - 24), h.start).toLowerCase();
    // copula / intensifier right before an adjective-like slang word: "that's fire", "so mid", "lowkey sus"
    return /(?:is|was|so|that's|thats|lowkey|low-key|highkey|kinda|straight|pure|lookin|looking|be|are|bro|no|big)\s+$/.test(before);
  });
}

function slangSentenceToEnglish(sentence: string, mode: ContentMode, notes: Set<string>) {
  let pre = sentence;
  let contextHits = 0;
  for (const rule of SLANG_TO_EN) {
    rule.re.lastIndex = 0;
    if (rule.re.test(pre)) {
      rule.re.lastIndex = 0;
      contextHits += pre.match(rule.re)?.length ?? 0;
      pre = pre.replace(rule.re, rule.to);
      notes.add(rule.note);
    }
  }
  const hits = detectSlang(pre, mode);
  const segments: Segment[] = [];
  let last = 0;
  let ambiguousUsed = false;
  for (const h of hits) {
    if (h.start < last) continue;
    if (h.start > last) segments.push({ text: pre.slice(last, h.start) });
    let rep = plainOf(h.term);
    if (h.start === 0 || /[.!?]\s*$/.test(pre.slice(0, h.start))) rep = capitalizeFirst(rep);
    segments.push({ text: rep, term: h.term });
    if (h.ambiguous) ambiguousUsed = true;
    if (h.term.meanings.length) notes.add(`“${h.surface}” can also mean: ${h.term.meanings[0]}`);
    last = h.end;
  }
  if (last < pre.length) segments.push({ text: pre.slice(last) });
  // tidy: doubled articles, stray spacing before punctuation
  const tidy = segments.map((s, i) => ({
    ...s,
    text: i === 0 ? capitalizeFirst(s.text) : s.text,
  }));
  return { segments: tidy, hits, ambiguousUsed, contextHits };
}

// ---------- public API -----------------------------------------------------------------

export function translate(input: string, opts: TranslateOptions): TranslationResult {
  const intensity = clamp(Math.round(opts.intensity), 1, 10);
  const seed = opts.seed ?? 0;
  const notes = new Set<string>();
  const r = rng(hashString(input) ^ (seed * 2654435761));

  if (!input.trim()) {
    return { input, text: '', segments: [], explanations: [], confidence: 'low', notes: [], matched: 0 };
  }

  if (opts.direction === 'slang2en') {
    const segments: Segment[] = [];
    let total = 0;
    let ambiguous = false;
    for (const s of splitSentences(input)) {
      const res = slangSentenceToEnglish(s, opts.mode, notes);
      segments.push(...res.segments);
      total += res.hits.length + res.contextHits;
      ambiguous ||= res.ambiguousUsed;
    }
    const explanations = collectExplanations(segments);
    const lowConfTerm = explanations.some((e) => e.term.confidence === 'low');
    if (total === 0) notes.add("We didn't spot any slang we know. If you think something here is slang, suggest it below so it can be reviewed.");
    if (ambiguous) notes.add('Some words here are also ordinary English, so we read them as slang based on context.');
    return {
      input, text: plainText(segments), segments, explanations,
      confidence: total === 0 ? 'low' : ambiguous || lowConfTerm ? 'medium' : 'high',
      notes: [...notes], matched: total,
    };
  }

  if (opts.direction === 'slang2slang') {
    const english = translate(input, { ...opts, direction: 'slang2en' });
    const slang = translate(english.text, { ...opts, direction: 'en2slang' });
    return {
      ...slang,
      input,
      notes: [`Read as: “${english.text.trim()}”`, ...english.notes.filter((n) => !n.startsWith("We didn't")), ...slang.notes],
      confidence: english.confidence === 'low' || slang.confidence === 'low' ? 'low' : 'medium',
      matched: english.matched + slang.matched,
    };
  }

  // School Appropriate never uses anything above family-rated, whatever the content mode
  const mode: ContentMode = opts.style === 'school' ? 'family' : opts.mode;
  let filled = '';
  let matched = 0;
  for (const s of splitSentences(input)) {
    if (/^\n+$/.test(s)) { filled += s; continue; }
    const code = styleCode(opts.style, intensity, r);
    const res = englishSentenceToSlang(s, code, intensity, mode, r);
    filled += res.out;
    matched += res.matched;
  }
  const segments = toSegments(filled);
  if (matched === 0) notes.add("We couldn't find phrases we know how to slangify, so we only added some flavour. Try simpler sentences like “That was really impressive.”");
  return {
    input, text: plainText(segments), segments, explanations: collectExplanations(segments),
    confidence: matched === 0 ? 'low' : matched === 1 && input.split(/\s+/).length > 12 ? 'medium' : 'high',
    notes: [...notes], matched,
  };
}

/** Several distinct alternatives (different seeds). */
export function alternatives(input: string, opts: TranslateOptions, count = 3): TranslationResult[] {
  const seen = new Set<string>([translate(input, opts).text]);
  const out: TranslationResult[] = [];
  for (let i = 1; i <= 12 && out.length < count; i++) {
    const res = translate(input, { ...opts, seed: (opts.seed ?? 0) + i * 7 });
    if (!seen.has(res.text)) { seen.add(res.text); out.push(res); }
  }
  return out;
}
