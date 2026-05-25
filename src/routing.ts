// Minimal query-string routing without react-router. Routes:
//   /                       -> dashboard
//   /?c=<charId>            -> sheet for that character
//   /?view=<uid>           -> storyteller read-only (legacy single-char, Phase 4)
//   /?view=<uid>/<charId>  -> storyteller read-only for one character (Phase 4)
import { useSyncExternalStore } from 'react';

export type Route =
  | { name: 'dashboard' }
  | { name: 'sheet'; charId: string }
  | { name: 'view'; uid: string; charId?: string };

function parse(): Route {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view) {
    const [uid, charId] = view.split('/');
    return { name: 'view', uid, charId };
  }
  const c = params.get('c');
  if (c) return { name: 'sheet', charId: c };
  return { name: 'dashboard' };
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('popstate', cb);
  window.addEventListener('vtm:navigate', cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener('vtm:navigate', cb);
  };
}

let cached = window.location.search;
let cachedRoute = parse();
function getSnapshot(): Route {
  if (window.location.search !== cached) {
    cached = window.location.search;
    cachedRoute = parse();
  }
  return cachedRoute;
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function navigate(to: Route): void {
  const url = new URL(window.location.href);
  url.search = '';
  if (to.name === 'sheet') url.searchParams.set('c', to.charId);
  else if (to.name === 'view') url.searchParams.set('view', to.charId ? `${to.uid}/${to.charId}` : to.uid);
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('vtm:navigate'));
}

export const goDashboard = () => navigate({ name: 'dashboard' });
export const goSheet = (charId: string) => navigate({ name: 'sheet', charId });

/** Public storyteller share link for a character (keeps the deploy base path). */
export function shareLink(uid: string, charId: string): string {
  return `${window.location.origin}${window.location.pathname}?view=${uid}/${charId}`;
}
