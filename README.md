# SlangStone

Translate between plain English and youth slang, explore a 480-term slang dictionary, play ten slang games, take a daily challenge, and make meme cards. No account needed, and it works offline.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm test             # engine, data and scoring tests (Vitest)
npm run typecheck
npm run data:validate
npm run build        # static site in dist/
```

### Optional AI + review-queue server

The app is a static site. The optional server in `server/index.mjs` (no dependencies) adds:

- AI-polished translations and challenge feedback, when `ANTHROPIC_API_KEY` is set.
- A suggestion queue that a human reviews, with admin routes protected by `ADMIN_TOKEN`.

```bash
cp .env.example .env   # fill in values
npm run build
node --env-file=.env server/index.mjs   # http://localhost:8787 (serves dist/ + /api)
```

During development, run the server in a second terminal next to `npm run dev`. Vite proxies `/api` to port 8787.

Server details:

- The API key stays on the server, and requests are rate-limited per IP.
- Inputs are length-capped.
- The model is told the audience may include children.
- When the server isn't running, the AI buttons don't appear.

## Deploy

- **Static only (Netlify, Vercel, GitHub Pages, S3):** run `npm run build` and upload `dist/`. Hash routing means no rewrite rules are needed.
- **With AI and the review queue (Render, Fly, Railway, any Node 20+ host):** run `npm ci && npm run build`, then start with `node server/index.mjs`. Set the env vars from `.env.example` there. Suggestions are written to `data/suggestions.jsonl`, so mount persistent storage there.

## What's inside

| Area | Where |
|---|---|
| Slang database (JSON, one file per domain, auto-loaded) | `src/data/terms/*.json`, schema in `src/data/types.ts` |
| Hand-written game content (nonsense pool, Rizz or Cringe, decoder, challenges) | `src/data/content.ts` |
| Translation engine (rule-based, deterministic, offline) | `src/engine/translate.ts`, `src/engine/rules.ts` |
| Question generators (games, quiz, daily) | `src/engine/questions.ts` |
| Local progress, XP, achievements | `src/lib/store.tsx` |
| Pages | `src/pages/*`, games in `src/pages/games/*` |
| Design tokens and components | `src/styles.css`, `src/components/*` |
| Data maintenance CLI | `scripts/data.mjs`, see `docs/DATA.md` |

### Translation pipeline

1. Split the input into sentences, keeping the original punctuation and spacing.
2. **English → slang:** match phrase rules longest-first. Each rule has options tagged by style and intensity range. Pick a weighted, seeded option, then add flourishes scaled to intensity, then fix "a/an" and capitalization.
3. **Slang → English:** apply context rules first (for example, "bro is" becomes "he is" and "zero aura" becomes "no cool factor"). Then match every spelling in the dictionary, longest first. Common English words that are also slang ("fire", "read", "bet") only count when the context supports it.
4. **Slang → slang:** translate slang → English, then English → the target style.
5. Each result includes linked term segments, explanations, alternatives (other seeds), a confidence level, and notes about ambiguity.

Content modes (Family, the default; Teen; Unfiltered) filter the dictionary and translations. Games never use `mature` terms. The School Appropriate style is always family-only.

### Daily challenge rule

The daily challenge uses the **UTC** calendar date as its seed and the family-rated pool. Everyone gets the same 7 questions, and a new challenge starts at 00:00 UTC. Answers are saved the moment you pick them, so refreshing doesn't reset anything. Slang Wordle uses the same rule.

## Privacy

There are no accounts and no analytics. Progress is stored in `localStorage` on the device; if storage is blocked, the app still works but forgets progress. Reset is on the Hall of Fame page.
