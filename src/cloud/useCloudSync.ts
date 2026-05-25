// Write side of cloud sync (the read side is a one-shot load — see SheetScreen
// for the owner and StorytellerView for the master; neither holds a live
// subscription). Two write modes:
//   - default: flush to Firestore when the player leaves the sheet (unmount) and
//     on tab close. Most play is single-device, so a per-session write is enough.
//   - live (player shared with a storyteller): also push at most once every ~5s
//     while editing, so a master who reloads sees near-fresh data.
import { useEffect, useRef } from 'react';
import type { Character } from '@/domain/character';
import { isCloudConfigured } from './config';
import { saveRemote } from './firebase';

const LIVE_INTERVAL = 5000;

export function useCloudSync(uid: string | null | undefined, ch: Character | null, live: boolean) {
  const enabled = !!uid && isCloudConfigured();
  const chRef = useRef(ch);
  chRef.current = ch;
  const lastPush = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = () => {
    if (enabled && uid && chRef.current) {
      lastPush.current = Date.now();
      saveRemote(uid, chRef.current).catch(() => {});
    }
  };

  // Live mode: throttled push (leading-capped) so the master's next reload is fresh.
  useEffect(() => {
    if (!enabled || !live || !ch) return;
    const wait = Math.max(0, LIVE_INTERVAL - (Date.now() - lastPush.current));
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, wait);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, live, ch]);

  // Flush once when leaving the sheet (unmount) and best-effort on tab close.
  useEffect(() => {
    if (!enabled) return;
    const onUnload = () => flush();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, uid]);
}
