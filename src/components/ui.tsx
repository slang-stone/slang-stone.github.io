import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BY_ID, allowed, plainOf, type SlangTerm } from '../data';
import type { Segment } from '../engine/translate';
import { go, href } from '../lib/router';
import { copyText } from '../lib/share';
import { useMode, useProgress } from '../lib/store';

// ---- brand ---------------------------------------------------------------------------

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0d0b1e" />
      <path d="M10 14h30a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H24l-9 8v-8h-5V14z" fill="#c6ff3d" />
      <path d="M26 22h28v20a6 6 0 0 1-6 6h-4v7l-8-7H26a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6z" fill="#9b5cff" />
      <path d="M33 31h14m-4-4 4 4-4 4M47 40H33m4-4-4 4 4 4" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <a className="logo" href={href('')} aria-label="SlangStone home">
      <LogoMark />
      <div className="logo-word">Slang<span>Stone</span></div>
    </a>
  );
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1>{title}</h1>
      {children && <div className="muted" style={{ maxWidth: '62ch', fontSize: '1.05rem' }}>{children}</div>}
    </header>
  );
}

// ---- badges --------------------------------------------------------------------------

const STATUS_LABEL: Record<string, string> = {
  current: 'Current', established: 'Established', ironic: 'Mostly ironic', fading: 'Fading', throwback: 'Throwback', unverified: 'Needs verification',
};
export const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{statusLabel(status)}</span>;
}

export function RatingBadge({ rating }: { rating: string }) {
  if (rating === 'family') return null;
  return <span className={`badge ${rating}`} title={rating === 'mature' ? 'Mature or sensitive origin' : 'Teen: mildly rude or edgy'}>{rating === 'mature' ? '18+ / sensitive' : 'Teen'}</span>;
}

export function Meter({ value, max = 5, label }: { value: number; max?: number; label: string }) {
  return (
    <span className="meter" role="img" aria-label={`${label}: ${value} of ${max}`} title={`${label}: ${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => <i key={i} className={i < value ? 'on' : ''} />)}
    </span>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  reactions: 'Reactions', compliments: 'Compliments', roasts: 'Roasts', friendship: 'Friendship', dating: 'Dating', school: 'School',
  gaming: 'Gaming', food: 'Food', fashion: 'Fashion', emotions: 'Emotions', approval: 'Agreement', disagreement: 'Disagreement',
  memes: 'Memes', brainrot: 'Brain rot', texting: 'Texting', 'social-media': 'Social media', entertainment: 'Music & TV',
  college: 'College', regional: 'Regional', outdated: 'Outdated', sensitive: 'Sensitive',
};
export const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c;

const GEN_LABEL: Record<string, string> = { alpha: 'Gen Alpha', z: 'Gen Z', millennial: 'Millennial', 'older-internet': 'Older internet' };
export const genLabel = (g: string) => GEN_LABEL[g] ?? g;

// ---- toast ---------------------------------------------------------------------------

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="sr-only">{msg}</div>
      {msg && <div className="toast" role="status">{msg}</div>}
    </ToastCtx.Provider>
  );
}

// ---- term sheet ----------------------------------------------------------------------

const SheetCtx = createContext<(id: string) => void>(() => {});
export const useOpenTerm = () => useContext(SheetCtx);

export function TermSheetProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const { viewTerm } = useProgress();
  const open = useCallback((tid: string) => { setId(tid); viewTerm(tid); }, [viewTerm]);
  const term = id ? BY_ID.get(id) : undefined;
  return (
    <SheetCtx.Provider value={open}>
      {children}
      {term && <Modal onClose={() => setId(null)} label={term.term}><TermDetail term={term} onNavigate={open} onClose={() => setId(null)} /></Modal>}
    </SheetCtx.Provider>
  );
}

export function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus(); };
  }, [onClose]);
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref}>{children}</div>
    </div>
  );
}

export function FavButton({ id, small }: { id: string; small?: boolean }) {
  const { p, toggleFavorite } = useProgress();
  const toast = useToast();
  const on = p.favorites.includes(id);
  return (
    <button
      className={`btn icon ${small ? 'sm' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Remove from favorites' : 'Add to favorites'}
      title={on ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => { e.stopPropagation(); toggleFavorite(id); toast(on ? 'Removed from favorites' : 'Saved. Your slang license has been renewed.'); }}
    >{on ? '💜' : '🤍'}</button>
  );
}

function TermDetail({ term: t, onNavigate, onClose }: { term: SlangTerm; onNavigate: (id: string) => void; onClose: () => void }) {
  const mode = useMode();
  const toast = useToast();
  const related = [...new Set([...t.related, ...t.synonyms, ...t.opposites])]
    .map((r) => BY_ID.get(r)).filter((r): r is SlangTerm => !!r && allowed(r, mode) && r.id !== t.id);
  return (
    <article className="stack">
      <div className="spread">
        <div className="row">
          <StatusBadge status={t.status} />
          <RatingBadge rating={t.rating} />
          {t.categories.slice(0, 3).map((c) => <span key={c} className="badge">{categoryLabel(c)}</span>)}
        </div>
        <div className="row">
          <FavButton id={t.id} />
          <button className="btn icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
      <div>
        <h2 style={{ fontSize: '2.4rem', marginBottom: 4 }}>{t.term}</h2>
        <div className="muted small">
          {t.partOfSpeech}{t.pronunciation ? ` · say it: ${t.pronunciation}` : ''}{t.variants.length ? ` · also: ${t.variants.slice(0, 6).join(', ')}` : ''}
        </div>
      </div>
      <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{t.definition}</p>
      <div className="card flat" style={{ padding: 14 }}>
        <div className="small muted">In plain English</div>
        <div style={{ fontWeight: 700 }}>{plainOf(t)}</div>
      </div>
      {t.meanings.length > 0 && (
        <div><h4>Other meanings</h4><ul style={{ margin: 0, paddingLeft: 20 }}>{t.meanings.map((m) => <li key={m}>{m}</li>)}</ul></div>
      )}
      <div className="card flat" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700 }}>“{t.example}”</div>
        <div className="muted">= “{t.exampleTranslation}”</div>
      </div>
      <div><h4>How it's used</h4><p className="muted" style={{ margin: 0 }}>{t.context}</p></div>
      {t.mistakes && <div><h4>Common mistakes</h4><p className="muted" style={{ margin: 0 }}>{t.mistakes}</p></div>}
      {t.sensitiveNote && <div className="feedback bad"><strong>Heads up: </strong>{t.sensitiveNote}</div>}
      {(t.origin || t.era) && (
        <div>
          <h4>Origin</h4>
          <p className="muted" style={{ margin: 0 }}>{t.origin}{t.era ? ` (${t.era})` : ''}</p>
          {t.confidence !== 'high' && <p className="small muted" style={{ marginTop: 4 }}>Origin details are approximate — confidence: {t.confidence}.</p>}
        </div>
      )}
      <div className="row small muted">
        <span>Formality <Meter value={t.formality} label="Formality" /></span>
        <span>Meme intensity <Meter value={t.memeIntensity} label="Meme intensity" /></span>
        <span>Used by: {t.generations.map(genLabel).join(', ') || 'varies'}</span>
        {t.regions.length > 0 && <span>Region: {t.regions.join(', ')}</span>}
      </div>
      {related.length > 0 && (
        <div><h4>Related</h4><div className="row">{related.slice(0, 10).map((r) => <button key={r.id} className="chip" onClick={() => onNavigate(r.id)}>{r.term}</button>)}</div></div>
      )}
      <div className="btn-row">
        <button className="btn primary" onClick={() => { onClose(); go(`translate?dir=slang2en&text=${encodeURIComponent(t.example)}`); }}>Translate the example</button>
        <button className="btn" onClick={async () => { await copyText(`${t.term}: ${t.definition}\n“${t.example}”`); toast('Copied. Certified no-cap definition.'); }}>Copy definition</button>
      </div>
      <details className="small muted">
        <summary>Sources & verification</summary>
        <p style={{ marginTop: 8 }}>Last reviewed {t.lastVerified} · confidence {t.confidence}. Definitions are written by us; links are for checking our work.</p>
        <ul style={{ paddingLeft: 18 }}>{t.sources.map((s) => <li key={s}><a href={s} target="_blank" rel="noreferrer noopener">{s.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}</a></li>)}</ul>
      </details>
    </article>
  );
}

// ---- term card + linked segments -----------------------------------------------------

export function TermCard({ term: t }: { term: SlangTerm }) {
  const open = useOpenTerm();
  return (
    <div className="card term-card" role="button" tabIndex={0} onClick={() => open(t.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t.id); } }}>
      <div className="spread">
        <h3>{t.term}</h3>
        <FavButton id={t.id} small />
      </div>
      <div className="row">
        <StatusBadge status={t.status} />
        <RatingBadge rating={t.rating} />
        <span className="badge">{categoryLabel(t.categories[0] ?? 'memes')}</span>
      </div>
      <p style={{ margin: 0 }}>{t.definition}</p>
      <p className="muted small" style={{ margin: 0 }}>“{t.example}”</p>
      <div className="small muted" style={{ marginTop: 'auto' }}>Meme intensity <Meter value={t.memeIntensity} label="Meme intensity" /></div>
    </div>
  );
}

export function Segments({ segments }: { segments: Segment[] }) {
  const open = useOpenTerm();
  return (
    <>
      {segments.map((s, i) =>
        s.term ? (
          <button key={i} className="term-link" onClick={() => open(s.term!.id)} title={`${s.term.term}: ${s.term.definition}`}>{s.text}</button>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
