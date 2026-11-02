#!/usr/bin/env node
// Slang database maintenance CLI. The JSON files in src/data/terms are the source of truth;
// the app rebuilds from them (`npm run build`). See docs/DATA.md for the review workflow.
//
//   node scripts/data.mjs validate            schema + reference checks (exit 1 on errors)
//   node scripts/data.mjs stats               counts by status / rating / category
//   node scripts/data.mjs export [out.json]   write the merged database to one file
//   node scripts/data.mjs import <file.json>  add/replace entries (by id) into src/data/terms/imported.json
//   node scripts/data.mjs add                 interactive: add a new term to src/data/terms/imported.json
//   node scripts/data.mjs merge <keepId> <dropId>  fold dropId's variants/sources into keepId, remove dropId
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

const DIR = path.resolve(import.meta.dirname, '../src/data/terms');
const ENUMS = {
  partOfSpeech: ['noun', 'verb', 'adjective', 'adverb', 'interjection', 'phrase', 'abbreviation', 'suffix'],
  tone: ['positive', 'negative', 'neutral', 'playful', 'sarcastic', 'mixed'],
  status: ['current', 'established', 'ironic', 'fading', 'throwback', 'unverified'],
  rating: ['family', 'teen', 'mature'],
  confidence: ['high', 'medium', 'low'],
};
const GENERATIONS = ['alpha', 'z', 'millennial', 'older-internet'];
const CATEGORIES = ['reactions', 'compliments', 'roasts', 'friendship', 'dating', 'school', 'gaming', 'food', 'fashion', 'emotions', 'approval', 'disagreement', 'memes', 'brainrot', 'texting', 'social-media', 'entertainment', 'college', 'regional', 'outdated', 'sensitive'];
const REQUIRED = ['id', 'term', 'partOfSpeech', 'definition', 'plain', 'example', 'exampleTranslation', 'tone', 'context', 'status', 'rating', 'confidence', 'lastVerified'];

const files = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
const load = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const save = (f, data) => fs.writeFileSync(path.join(DIR, f), JSON.stringify(data, null, 2) + '\n');
const all = () => files().flatMap((f) => load(f).map((t) => ({ ...t, __file: f })));
const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

function validate() {
  const terms = all();
  const errors = [], warnings = [];
  const ids = new Map(), surfaces = new Map();
  for (const t of terms) {
    const where = `${t.__file}:${t.id}`;
    for (const k of REQUIRED) if (t[k] === undefined || t[k] === '') errors.push(`${where} missing ${k}`);
    for (const [k, vals] of Object.entries(ENUMS)) if (t[k] && !vals.includes(t[k])) errors.push(`${where} bad ${k}: ${t[k]}`);
    for (const k of ['variants', 'meanings', 'generations', 'categories', 'related', 'synonyms', 'opposites', 'regions', 'sources'])
      if (!Array.isArray(t[k])) errors.push(`${where} ${k} must be an array`);
    for (const g of t.generations ?? []) if (!GENERATIONS.includes(g)) errors.push(`${where} bad generation ${g}`);
    for (const c of t.categories ?? []) if (!CATEGORIES.includes(c)) errors.push(`${where} bad category ${c}`);
    for (const k of ['formality', 'memeIntensity']) if (!(t[k] >= 1 && t[k] <= 5)) errors.push(`${where} ${k} must be 1-5`);
    if (!(t.difficulty >= 1 && t.difficulty <= 3)) errors.push(`${where} difficulty must be 1-3`);
    if (t.rating !== 'family' && !t.sensitiveNote) warnings.push(`${where} ${t.rating} term has no sensitiveNote`);
    if (!t.sources?.length) warnings.push(`${where} has no sources`);
    if (ids.has(t.id)) errors.push(`duplicate id ${t.id} (${ids.get(t.id)} and ${t.__file})`);
    ids.set(t.id, t.__file);
    for (const s of [t.term, ...(t.variants ?? [])]) {
      const k = norm(s);
      if (surfaces.has(k) && surfaces.get(k) !== t.id) warnings.push(`surface "${s}" used by ${surfaces.get(k)} and ${t.id}`);
      else surfaces.set(k, t.id);
    }
  }
  for (const t of terms) for (const r of t.related ?? []) if (!ids.has(r) && /^[a-z0-9-]+$/.test(r)) warnings.push(`${t.id} related → unknown id "${r}"`);
  return { terms, errors, warnings };
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

if (cmd === 'validate') {
  const { terms, errors, warnings } = validate();
  const verbose = args.includes('--verbose');
  if (verbose) warnings.forEach((w) => console.log('warn ', w));
  errors.forEach((e) => console.log('ERROR', e));
  console.log(`${terms.length} terms · ${errors.length} errors · ${warnings.length} warnings${verbose ? '' : ' (use --verbose to list warnings)'}`);
  process.exit(errors.length ? 1 : 0);
} else if (cmd === 'stats') {
  const terms = all();
  const count = (fn) => terms.flatMap(fn).reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
  console.log('total', terms.length);
  console.log('status', count((t) => [t.status]));
  console.log('rating', count((t) => [t.rating]));
  console.log('confidence', count((t) => [t.confidence]));
  console.log('categories', count((t) => t.categories));
} else if (cmd === 'export') {
  const out = args[0] ?? 'slang-export.json';
  fs.writeFileSync(out, JSON.stringify(all().map(({ __file, ...t }) => t), null, 2));
  console.log(`exported to ${out}`);
} else if (cmd === 'import') {
  if (!args[0]) throw new Error('usage: import <file.json>');
  const incoming = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  const existing = new Map(all().map((t) => [t.id, t.__file]));
  const target = fs.existsSync(path.join(DIR, 'imported.json')) ? load('imported.json') : [];
  let added = 0, replaced = 0;
  for (const t of incoming) {
    const f = existing.get(t.id);
    if (f && f !== 'imported.json') {
      const data = load(f).map((x) => (x.id === t.id ? t : x));
      save(f, data);
      replaced++;
    } else {
      const i = target.findIndex((x) => x.id === t.id);
      if (i >= 0) { target[i] = t; replaced++; } else { target.push(t); added++; }
    }
  }
  save('imported.json', target);
  console.log(`${added} added, ${replaced} replaced. Run validate next.`);
} else if (cmd === 'merge') {
  const [keepId, dropId] = args;
  const terms = all();
  const keep = terms.find((t) => t.id === keepId), drop = terms.find((t) => t.id === dropId);
  if (!keep || !drop) throw new Error('both ids must exist');
  const uniq = (a) => [...new Set(a)];
  const merged = { ...keep, variants: uniq([...keep.variants, drop.term.toLowerCase(), ...drop.variants]), meanings: uniq([...keep.meanings, ...drop.meanings]), sources: uniq([...keep.sources, ...drop.sources]), related: uniq([...keep.related, ...drop.related]).filter((r) => r !== keepId && r !== dropId) };
  delete merged.__file;
  save(keep.__file, load(keep.__file).map((t) => (t.id === keepId ? merged : t)));
  save(drop.__file, load(drop.__file).filter((t) => t.id !== dropId));
  console.log(`merged ${dropId} into ${keepId}`);
} else if (cmd === 'add') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q, d = '') => rl.question(`${q}${d ? ` [${d}]` : ''}: `).then((a) => a.trim() || d);
  const term = await ask('Term');
  const id = term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const entry = {
    id, term, variants: (await ask('Variants (comma separated)')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
    partOfSpeech: await ask('Part of speech', 'phrase'), definition: await ask('Definition'), meanings: [],
    plain: await ask('Plain-English drop-in'), example: await ask('Example sentence'), exampleTranslation: await ask('Example in plain English'),
    tone: await ask('Tone', 'neutral'), context: await ask('Usage context'), generations: (await ask('Generations', 'z')).split(',').map((s) => s.trim()),
    categories: (await ask('Categories', 'reactions')).split(',').map((s) => s.trim()), related: [], synonyms: [], opposites: [],
    formality: 2, memeIntensity: Number(await ask('Meme intensity 1-5', '2')), difficulty: 2,
    status: 'unverified', regions: [], rating: await ask('Rating family/teen/mature', 'family'),
    sources: (await ask('Source URLs (comma separated)')).split(',').map((s) => s.trim()).filter(Boolean),
    lastVerified: new Date().toISOString().slice(0, 10), confidence: 'low',
  };
  rl.close();
  const target = fs.existsSync(path.join(DIR, 'imported.json')) ? load('imported.json') : [];
  target.push(entry);
  save('imported.json', target);
  console.log(`added ${id} as status "unverified" / confidence "low" — review before raising them.`);
} else {
  console.log(fs.readFileSync(import.meta.filename, 'utf8').split('\n').slice(1, 12).join('\n'));
}
