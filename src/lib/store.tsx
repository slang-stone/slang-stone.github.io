import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContentMode } from '../data';
import { bestStreak, streakFrom, todayKey } from './dates';
import { setSoundEnabled } from './sfx';
import { storage } from './storage';

// Everything is stored locally on this device. No accounts, names, emails or birthdays.
const KEY = 'slang-translator:v1';

export interface SavedTranslation { id: string; input: string; output: string; direction: string; style: string; at: string }
export interface Suggestion { text: string; meaning: string; at: string }

export interface Progress {
  settings: { mode: ContentMode; theme: 'dark' | 'light'; sound: boolean; reactions: 'off' | 'classic' | 'mine'; reactRight: string[]; reactWrong: string[] };
  xp: number;
  favorites: string[];
  saved: SavedTranslation[];
  recent: string[];
  mistakes: Record<string, number>;
  correct: Record<string, number>;
  stats: { answered: number; right: number; translations: number; games: number; generated: number; shares: number; termsViewed: number; challenges: number };
  bests: Record<string, number>;
  gamesPlayed: string[];
  daily: Record<string, { score: number; total: number }>;
  achievements: Record<string, string>;
  suggestions: Suggestion[];
}

export const EMPTY: Progress = {
  settings: { mode: 'family', theme: 'dark', sound: true, reactions: 'classic', reactRight: [], reactWrong: [] },
  xp: 0, favorites: [], saved: [], recent: [], mistakes: {}, correct: {},
  stats: { answered: 0, right: 0, translations: 0, games: 0, generated: 0, shares: 0, termsViewed: 0, challenges: 0 },
  bests: {}, gamesPlayed: [], daily: {}, achievements: {}, suggestions: [],
};

function load(): Progress {
  const raw = storage.get<Partial<Progress>>(KEY, {});
  return { ...EMPTY, ...raw, settings: { ...EMPTY.settings, ...raw.settings }, stats: { ...EMPTY.stats, ...raw.stats } };
}

// ---- levels & achievements -----------------------------------------------------------

export const LEVEL_TITLES = ['Fresh Spawn', 'Slang Rookie', 'Certified Yapper', 'Vibe Checker', 'Aura Apprentice', 'Rizz Researcher', 'Lore Keeper', 'Slang Scholar', 'Main Character', 'Certified GOAT'];
export function levelOf(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 40)) + 1;
  const cur = (level - 1) ** 2 * 40;
  const next = level ** 2 * 40;
  return { level, title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)], into: xp - cur, need: next - cur };
}

export const learnedIds = (p: Progress) => Object.keys(p.correct).filter((id) => p.correct[id] >= 1);
export const masteredIds = (p: Progress) => Object.keys(p.correct).filter((id) => p.correct[id] >= 3 && (p.mistakes[id] ?? 0) < p.correct[id]);
export const dailyStreak = (p: Progress) => streakFrom(new Set(Object.keys(p.daily)));
export const dailyBestStreak = (p: Progress) => bestStreak(new Set(Object.keys(p.daily)));

export interface Achievement { id: string; name: string; emoji: string; desc: string; test: (p: Progress) => boolean; progress?: (p: Progress) => [number, number] }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'no-cap', name: 'No Cap', emoji: '🧢', desc: 'Make your first translation.', test: (p) => p.stats.translations >= 1 },
  { id: 'rizzologist', name: 'Certified Rizzologist', emoji: '😏', desc: 'Score 30+ in Rizz or Cringe.', test: (p) => (p.bests['rizz-or-cringe'] ?? 0) >= 30 },
  { id: 'aura-architect', name: 'Aura Architect', emoji: '✨', desc: 'Reach level 5.', test: (p) => levelOf(p.xp).level >= 5, progress: (p) => [Math.min(levelOf(p.xp).level, 5), 5] },
  { id: 'brain-rot-survivor', name: 'Brain Rot Survivor', emoji: '🧠', desc: 'Score 40+ in Brain Rot Decoder.', test: (p) => (p.bests['brain-rot-decoder'] ?? 0) >= 40 },
  { id: 'slang-scholar', name: 'Slang Scholar', emoji: '🎓', desc: 'Learn 50 different terms.', test: (p) => learnedIds(p).length >= 50, progress: (p) => [Math.min(learnedIds(p).length, 50), 50] },
  { id: 'cooked-but-learning', name: 'Cooked but Learning', emoji: '🍳', desc: 'Get 10 answers wrong — and keep going.', test: (p) => p.stats.answered - p.stats.right >= 10, progress: (p) => [Math.min(p.stats.answered - p.stats.right, 10), 10] },
  { id: 'dictionary-demon', name: 'Dictionary Demon', emoji: '📖', desc: 'Open 40 dictionary entries.', test: (p) => p.stats.termsViewed >= 40, progress: (p) => [Math.min(p.stats.termsViewed, 40), 40] },
  { id: 'six-seven', name: 'Six Seven Specialist', emoji: '🤷', desc: 'Get 67 answers right.', test: (p) => p.stats.right >= 67, progress: (p) => [Math.min(p.stats.right, 67), 67] },
  { id: 'touch-grass', name: 'Touch Grass Champion', emoji: '🌱', desc: 'Keep a 3-day daily challenge streak.', test: (p) => dailyBestStreak(p) >= 3, progress: (p) => [Math.min(dailyBestStreak(p), 3), 3] },
  { id: 'fluent-in-yap', name: 'Fluent in Yap', emoji: '🗣️', desc: 'Make 25 translations.', test: (p) => p.stats.translations >= 25, progress: (p) => [Math.min(p.stats.translations, 25), 25] },
  { id: 'game-hopper', name: 'Side Quest Enjoyer', emoji: '🗺️', desc: 'Play all 10 games.', test: (p) => p.gamesPlayed.length >= 10, progress: (p) => [Math.min(p.gamesPlayed.length, 10), 10] },
  { id: 'master', name: 'Mastery Unlocked', emoji: '🏆', desc: 'Master 20 terms (3+ correct answers each).', test: (p) => masteredIds(p).length >= 20, progress: (p) => [Math.min(masteredIds(p).length, 20), 20] },
  { id: 'daily-first', name: 'Daily Grinder', emoji: '📅', desc: 'Finish a daily challenge.', test: (p) => Object.keys(p.daily).length >= 1 },
  { id: 'meme-lord', name: 'Meme Lab Intern', emoji: '🧪', desc: 'Generate 10 things in the Meme Lab.', test: (p) => p.stats.generated >= 10, progress: (p) => [Math.min(p.stats.generated, 10), 10] },
  { id: 'collector', name: 'Word Hoarder', emoji: '💾', desc: 'Favorite 10 terms.', test: (p) => p.favorites.length >= 10, progress: (p) => [Math.min(p.favorites.length, 10), 10] },
  { id: 'translator-challenger', name: 'Assignment Understood', emoji: '📝', desc: 'Complete 5 translation challenges.', test: (p) => p.stats.challenges >= 5, progress: (p) => [Math.min(p.stats.challenges, 5), 5] },
];

// ---- context -------------------------------------------------------------------------

interface Store {
  p: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  addXP: (n: number) => void;
  answer: (termId: string | undefined, ok: boolean, xp?: number) => void;
  finishGame: (gameId: string, score: number) => boolean; // true = new personal best
  toggleFavorite: (termId: string) => void;
  viewTerm: (termId: string) => void;
  reset: () => void;
  newAchievements: Achievement[];
  clearNew: () => void;
}

const Ctx = createContext<Store | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progress>(load);
  const [newAchievements, setNew] = useState<Achievement[]>([]);

  useEffect(() => {
    storage.set(KEY, p);
    document.documentElement.dataset.theme = p.settings.theme;
    setSoundEnabled(p.settings.sound);
  }, [p]);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setP((prev) => {
      const next = fn(prev);
      const earned = ACHIEVEMENTS.filter((a) => !next.achievements[a.id] && a.test(next));
      if (!earned.length) return next;
      const today = todayKey();
      setNew((n) => [...n, ...earned]);
      return { ...next, achievements: { ...next.achievements, ...Object.fromEntries(earned.map((a) => [a.id, today])) } };
    });
  }, []);

  const store = useMemo<Store>(() => ({
    p,
    update,
    addXP: (n) => update((s) => ({ ...s, xp: s.xp + n })),
    answer: (termId, ok, xp = 10) =>
      update((s) => ({
        ...s,
        xp: s.xp + (ok ? xp : 1),
        stats: { ...s.stats, answered: s.stats.answered + 1, right: s.stats.right + (ok ? 1 : 0) },
        correct: termId && ok ? { ...s.correct, [termId]: (s.correct[termId] ?? 0) + 1 } : s.correct,
        mistakes: termId && !ok ? { ...s.mistakes, [termId]: (s.mistakes[termId] ?? 0) + 1 } : s.mistakes,
      })),
    finishGame: (gameId, score) => {
      const isBest = score > (p.bests[gameId] ?? 0);
      update((s) => ({
        ...s,
        bests: score > (s.bests[gameId] ?? 0) ? { ...s.bests, [gameId]: score } : s.bests,
        gamesPlayed: s.gamesPlayed.includes(gameId) ? s.gamesPlayed : [...s.gamesPlayed, gameId],
        stats: { ...s.stats, games: s.stats.games + 1 },
      }));
      return isBest;
    },
    toggleFavorite: (id) =>
      update((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites] })),
    viewTerm: (id) =>
      update((s) => ({ ...s, recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 30), stats: { ...s.stats, termsViewed: s.stats.termsViewed + 1 } })),
    reset: () => { setP({ ...EMPTY, settings: p.settings }); setNew([]); },
    newAchievements,
    clearNew: () => setNew([]),
  }), [p, update, newAchievements]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useProgress outside provider');
  return s;
}

export const useMode = () => useProgress().p.settings.mode;
