import { Suspense, lazy, useEffect } from 'react';
import { Logo, LogoMark, TermSheetProvider, ToastProvider, useToast } from './components/ui';
import { href, useRoute } from './lib/router';
import { ProgressProvider, useProgress, levelOf } from './lib/store';
import { ModeSelect, ThemeToggle } from './components/settings';
import { ReactionOverlay } from './components/Reaction';
import Home from './pages/Home';
import { GAMES } from './pages/games/registry';
import { NAV } from './lib/nav';

const Translator = lazy(() => import('./pages/Translator'));
const Dictionary = lazy(() => import('./pages/Dictionary'));
const Games = lazy(() => import('./pages/Games'));
const Daily = lazy(() => import('./pages/Daily'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Generator = lazy(() => import('./pages/Generator'));
const Stats = lazy(() => import('./pages/Stats'));
const About = lazy(() => import('./pages/About'));

const MOBILE = ['', 'translate', 'dictionary', 'games', 'daily'];

export default function App() {
  return (
    <ProgressProvider>
      <ToastProvider>
        <TermSheetProvider>
          <Shell />
        </TermSheetProvider>
      </ToastProvider>
    </ProgressProvider>
  );
}

function AchievementWatcher() {
  const { newAchievements, clearNew } = useProgress();
  const toast = useToast();
  useEffect(() => {
    if (!newAchievements.length) return;
    const a = newAchievements[newAchievements.length - 1];
    toast(`${a.emoji} Achievement unlocked: ${a.name}`);
    clearNew();
  }, [newAchievements, clearNew, toast]);
  return null;
}

function Shell() {
  const route = useRoute();
  const { p } = useProgress();
  const top = route[0] ?? '';
  const lvl = levelOf(p.xp);

  let page;
  switch (top) {
    case '': page = <Home />; break;
    case 'translate': page = <Translator />; break;
    case 'dictionary': page = <Dictionary letter={route[1]} />; break;
    case 'games': {
      const g = GAMES.find((x) => x.id === route[1]);
      page = g ? <g.component /> : <Games />;
      break;
    }
    case 'daily': page = <Daily />; break;
    case 'quiz': page = <Quiz />; break;
    case 'generator': page = <Generator />; break;
    case 'stats': page = <Stats />; break;
    case 'about': page = <About />; break;
    default: page = <div className="card"><h2>404: this page touched grass and never came back.</h2><a className="btn primary" href={href('')}>Go home</a></div>;
  }

  return (
    <div className="app">
      <a href="#main" className="sr-only">Skip to content</a>
      <nav className="sidebar" aria-label="Main">
        <div style={{ marginBottom: 18 }}><Logo /></div>
        {NAV.map((n) => (
          <a key={n.path} href={href(n.path)} className={`nav-link ${top === n.path ? 'active' : ''}`} aria-current={top === n.path ? 'page' : undefined}>
            <span className="ico" aria-hidden="true">{n.icon}</span>{n.label}
          </a>
        ))}
        <div className="sidebar-foot">
          <a className="card flat" href={href('stats')} style={{ padding: 12, textDecoration: 'none', color: 'inherit' }}>
            <div className="small muted">Level {lvl.level} · {lvl.title}</div>
            <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${(lvl.into / lvl.need) * 100}%` }} /></div>
            <div className="small muted" style={{ marginTop: 4 }}>{p.xp} XP</div>
          </a>
          <ModeSelect />
          <ThemeToggle />
        </div>
      </nav>

      <div>
        <header className="topbar">
          <a className="logo" href={href('')} aria-label="Slang Translator home"><LogoMark size={34} /><span className="logo-word" style={{ fontSize: '1.05rem' }}>Slang<span>Translator</span></span></a>
          <div className="row">
            <a className="btn sm" href={href('stats')} aria-label={`Level ${lvl.level}, view stats`}>Lv {lvl.level}</a>
            <a className="btn sm" href={href('about')} aria-label="Settings and about">⚙️</a>
          </div>
        </header>
        <main className="main" id="main">
          <Suspense fallback={<div className="muted">Loading… translating the vibes</div>}>{page}</Suspense>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Quick">
        {MOBILE.map((path) => {
          const n = NAV.find((x) => x.path === path)!;
          return (
            <a key={path} href={href(path)} className={top === path ? 'active' : ''} aria-current={top === path ? 'page' : undefined}>
              <span className="ico" aria-hidden="true">{n.icon}</span>{n.label.split(' ')[0]}
            </a>
          );
        })}
      </nav>
      <AchievementWatcher />
      <ReactionOverlay />
    </div>
  );
}
