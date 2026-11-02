# Slang data: schema, review, and updates

The JSON files in `src/data/terms/` are the source of truth. The schema is `SlangTerm` in `src/data/types.ts`. Any new `*.json` file in that folder is picked up automatically on the next build.

## Field rules

- **`status`:** `current` | `established` | `ironic` | `fading` | `throwback` | `unverified`. Don't mark anything `current` because it went viral once.
- **`rating`:**
  - `family`: kid-safe.
  - `teen`: rude or edgy, or a body-focused origin.
  - `mature`: sexual or derogatory origins, or profanity.
  - Anything that isn't `family` needs a `sensitiveNote`.
- **`origin` and `era`:** only include them when you can support them. Hedge with "approx.", and credit AAVE, ballroom, gaming and other source communities.
- **`confidence`:** `low` keeps an entry out of games and the daily challenge.
- **`sources` and `lastVerified`:** update both whenever you verify an entry. Use Urban Dictionary or Know Your Meme only as evidence of community usage, never as the only source for a definition.

## Commands

```bash
npm run data:validate                 # schema, enums, duplicate ids and spellings (add -- --verbose)
npm run data:stats                    # counts by status / rating / category
npm run data:add                      # interactive; new entries are status "unverified", confidence "low"
npm run data:import -- reviewed.json  # add or replace entries by id
npm run data:merge -- keep-id drop-id # fold a duplicate into the canonical entry
npm run data:export -- out.json       # one merged file (for spreadsheets / review tools)
```

After any change, run `npm run data:validate && npm test && npm run build`. The test suite fails if a translator rule references a term that isn't in the database.

## Reviewing user suggestions

- **Static deployment:** suggestions stay on each user's device. They can export them from Hall of Fame → "Export suggestions" and send the JSON to a maintainer.
- **With the server:** suggestions are appended to `data/suggestions.jsonl`. Read them with:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8787/api/admin/suggestions
```

To archive the queue after review, send the same request with `-X DELETE`. The admin routes check the token on the server with a constant-time comparison; there is no admin button in the browser.

A reviewer researches each suggestion, writes an original definition, and adds it with `data:add` or `data:import`. Nothing is published automatically.

## Designing a future update pipeline

The schema already supports a scheduled, human-in-the-loop process:

1. **Collect** candidate expressions only from sources whose terms permit it, such as official APIs or licensed datasets. No unrestricted scraping.
2. **Compare** against `term` and `variants` (normalized) to find duplicates, and run `data:validate` for collisions.
3. **Draft** a definition and example, saved as `status: "unverified"` and `confidence: "low"`, with the evidence URLs in `sources`.
4. **Queue** the draft in a separate file (for example `drafts/*.json`) or a database table that the app does not load.
5. **Review:** a human edits the draft and sets `status`, `rating`, `confidence` and `lastVerified`, then imports it with `data:import`.
6. **Publish** by rebuilding. Never generate trend rankings or popularity claims automatically.

## Moving to a database

`SlangTerm` maps to one table plus link tables: `term_variants`, `term_categories`, `term_generations`, `term_related(from_id, to_id, kind: related|synonym|opposite)`, and `term_sources(url, verified_at)`. `data:export` produces the flat JSON to load into SQLite or Postgres. Only `src/data/index.ts` would need to change to read from an API.
