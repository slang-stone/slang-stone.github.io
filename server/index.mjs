#!/usr/bin/env node
// Optional server for Slang Translator. Zero dependencies (Node 20+).
//
// - Serves the built app from ./dist
// - /api/health                 → { ok, ai }
// - /api/translate   (POST)     → AI-polished translation      (needs ANTHROPIC_API_KEY)
// - /api/evaluate    (POST)     → AI feedback on a challenge   (needs ANTHROPIC_API_KEY)
// - /api/suggest     (POST)     → queue a term suggestion for human review (data/suggestions.jsonl)
// - /api/admin/suggestions (GET/DELETE) → review queue, requires `Authorization: Bearer $ADMIN_TOKEN`
//
// The API key never reaches the browser. Without the key, the app still works fully offline.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const PORT = Number(process.env.PORT ?? 8787);
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-5-5';
const ADMIN = process.env.ADMIN_TOKEN;
const LIMIT = Number(process.env.RATE_LIMIT_PER_MIN ?? 20);

// ---- tiny per-IP rate limiter --------------------------------------------------------
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > LIMIT;
}
setInterval(() => { const now = Date.now(); for (const [ip, l] of hits) if (!l.some((t) => now - t < 60_000)) hits.delete(ip); }, 60_000).unref();

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

function readJson(req, max = 4096) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, n);

async function claude(system, user) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 300, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error(`AI request failed (${r.status})`);
  const j = await r.json();
  return (j.content ?? []).map((c) => c.text ?? '').join('').trim();
}

const SAFETY = 'The audience may include children. Keep everything age-appropriate: no profanity, slurs, sexual content, or bullying. If the input asks for any of that, reply with a friendly, clean alternative instead.';

const isAdmin = (req) => {
  if (!ADMIN) return false;
  const got = Buffer.from(String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(ADMIN);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
};

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const ip = req.socket.remoteAddress ?? 'unknown';
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, ai: !!KEY });

    if (url.pathname.startsWith('/api/') && req.method === 'POST' && limited(ip)) return send(res, 429, { error: 'Slow down! Too many requests — try again in a minute.' });

    if (url.pathname === '/api/translate' && req.method === 'POST') {
      if (!KEY) return send(res, 503, { error: 'AI is not configured on this server.' });
      const b = await readJson(req);
      const text = clean(b.text, 600);
      if (!text.trim()) return send(res, 400, { error: 'Nothing to translate.' });
      const dir = { en2slang: 'plain English into youth slang', slang2en: 'youth slang into plain, clear English', slang2slang: 'one slang style into another' }[b.direction] ?? 'plain English into youth slang';
      const style = clean(b.style, 30), intensity = Math.max(1, Math.min(10, Number(b.intensity) || 5));
      const out = await claude(
        `You translate ${dir}. Preserve meaning, tone, and sentence structure; don't just stuff in slang. Style: ${style}. Slang intensity ${intensity}/10 (1 = subtle and natural, 10 = deliberately absurd meme language). ${SAFETY} Reply with ONLY the translation, one or two sentences, no quotes or commentary.`,
        text,
      );
      return send(res, 200, { text: out });
    }

    if (url.pathname === '/api/evaluate' && req.method === 'POST') {
      if (!KEY) return send(res, 503, { error: 'AI is not configured on this server.' });
      const b = await readJson(req);
      const out = await claude(
        `You are a friendly slang tutor. A student translated a sentence ${b.direction === 'slang' ? 'from slang into plain English' : 'from English into slang'}. In 2 short sentences, say what works and one tip. Many answers can be valid; never call a reasonable answer wrong. ${SAFETY}`,
        `Original: ${clean(b.prompt, 300)}\nStudent answer: ${clean(b.answer, 300)}`,
      );
      return send(res, 200, { text: out });
    }

    if (url.pathname === '/api/suggest' && req.method === 'POST') {
      const b = await readJson(req, 1024);
      const entry = { text: clean(b.text, 80), meaning: clean(b.meaning, 200), at: new Date().toISOString(), status: 'pending' };
      if (!entry.text.trim()) return send(res, 400, { error: 'Empty suggestion' });
      fs.mkdirSync(DATA, { recursive: true });
      fs.appendFileSync(path.join(DATA, 'suggestions.jsonl'), JSON.stringify(entry) + '\n');
      return send(res, 202, { queued: true });
    }

    if (url.pathname === '/api/admin/suggestions') {
      if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
      const file = path.join(DATA, 'suggestions.jsonl');
      if (req.method === 'GET') {
        const rows = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
        return send(res, 200, rows);
      }
      if (req.method === 'DELETE') { if (fs.existsSync(file)) fs.renameSync(file, `${file}.${Date.now()}.reviewed`); return send(res, 200, { cleared: true }); }
      return send(res, 405, { error: 'Method not allowed' });
    }

    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'Not found' });

    // static files (hash routing → always index.html for unknown paths)
    const rel = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    let file = path.join(DIST, rel);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
    if (!fs.existsSync(file)) return send(res, 500, 'Run `npm run build` first.', 'text/plain');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, e.message === 'too large' ? 413 : e.message === 'bad json' ? 400 : 502, { error: e.message === 'too large' ? 'Request too large' : 'Something went wrong. The offline translator still works.' });
  }
});

server.listen(PORT, () => console.log(`Slang Translator server on http://localhost:${PORT} · AI ${KEY ? `on (${MODEL})` : 'off'} · admin ${ADMIN ? 'on' : 'off'}`));
