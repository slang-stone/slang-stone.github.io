import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface GameInfo { id: string; title: string; emoji: string; blurb: string; color: string; component: LazyExoticComponent<ComponentType> }

// Each game has its own mechanics; ids double as personal-best keys and achievement hooks.
export const GAMES: GameInfo[] = [
  { id: 'match-that-slang', title: 'Match That Slang', emoji: '🧩', blurb: 'Drag or tap to pair slang with meanings. Combos stack.', color: 'pop', component: lazy(() => import('./MatchThatSlang')) },
  { id: 'guess-the-slang', title: 'Guess the Slang', emoji: '🤔', blurb: 'We give the meaning, you name the word.', color: 'cyan', component: lazy(() => import('./GuessTheSlang')) },
  { id: 'translate-or-cooked', title: 'Translate or Be Cooked', emoji: '🍳', blurb: 'Decode a slang sentence before the timer cooks you.', color: 'coral', component: lazy(() => import('./TranslateOrCooked')) },
  { id: 'brain-rot-decoder', title: 'Brain Rot Decoder', emoji: '🧠', blurb: 'Maximum-chaos sentences. Find the meaning.', color: 'purple', component: lazy(() => import('./BrainRotDecoder')) },
  { id: 'rizz-or-cringe', title: 'Rizz or Cringe?', emoji: '😬', blurb: 'Smooth, awkward, funny, or “it depends”?', color: 'coral', component: lazy(() => import('./RizzOrCringe')) },
  { id: 'slang-wordle', title: 'Slang Wordle', emoji: '🟩', blurb: 'One daily slang word. Six guesses.', color: 'pop', component: lazy(() => import('./SlangWordle')) },
  { id: 'who-said-that', title: 'Who Said That?', emoji: '🕵️', blurb: 'Gen Alpha, Gen Z, or the old internet?', color: 'purple', component: lazy(() => import('./WhoSaidThat')) },
  { id: 'slang-speedrun', title: 'Slang Speedrun', emoji: '⚡', blurb: 'Three lives. Shrinking timer. Go.', color: 'cyan', component: lazy(() => import('./SlangSpeedrun')) },
  { id: 'build-a-sentence', title: 'Build-a-Sentence', emoji: '🧱', blurb: 'Stack slang pieces into the perfect reply.', color: 'pop', component: lazy(() => import('./BuildASentence')) },
  { id: 'slang-or-nonsense', title: 'Slang or Nonsense?', emoji: '🧪', blurb: 'Real slang, fading slang, or something we made up?', color: 'purple', component: lazy(() => import('./SlangOrNonsense')) },
];
