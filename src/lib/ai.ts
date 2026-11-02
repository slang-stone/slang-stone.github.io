// Optional AI translation via the app's own server (server/index.mjs). The API key lives only on
// the server; the browser never sees it. If no server is running, the app works fully offline.
let cached: Promise<boolean> | null = null;

export function aiAvailable() {
  cached ??= fetch('/api/health')
    .then((r) => (r.ok ? r.json() : { ai: false }))
    .then((j) => !!j.ai)
    .catch(() => false);
  return cached;
}

export async function aiTranslate(body: { text: string; direction: string; style: string; intensity: number; mode: string }) {
  const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? 'The AI helper is unavailable right now. The offline translation above still works.');
  return String(j.text ?? '');
}
