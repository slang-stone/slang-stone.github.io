import { useEffect, useState } from 'react';

// Hash routing keeps the app deployable to any static host (no server rewrites needed).
export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('?')[0];
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => { setPath(read()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path.split('/').filter(Boolean).map(decodeURIComponent);
}

export const go = (path: string) => { window.location.hash = `/${path.replace(/^\//, '')}`; };
export const href = (path: string) => `#/${path.replace(/^\//, '')}`;

export function queryParam(name: string) {
  const q = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(q).get(name);
}
