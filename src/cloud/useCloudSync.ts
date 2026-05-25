// Write side of cloud sync (the read side is one-shot: SheetScreen for the
// owner, StorytellerView for the master — no live subscriptions). When signed
// in, pushes the open character to Firestore on a ~5s throttle while editing,
// plus a flush when leaving the sheet / closing the tab. So the remote doc stays
// near-current and a master who reloads sees fresh data — cheaply. No-op when
// not configured or signed out.
import { useEffect, useRef } from 'react';
import type { Character } from '@/domain/character';
import { isCloudConfigured } from './config';
import { saveRemote } from './firebase';
import { markSynced } from '@/store/characters';

const THROTTLE = 5000;

export function useCloudSync(uid: string | null | undefined, ch: Character | null) {
  const enabled = !!uid && isCloudConfigured();
  const chRef = useRef(ch);
  chRef.current = ch;
  const lastPush = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = () => {
    if (enabled && uid && chRef.current) {
      lastPush.current = Date.now();
      const id = chRef.current.id;
      saveRemote(uid, chRef.current).then(() => markSynced(id)).catch(() => {});
    }
  };

  // Throttled push on edits (at most once per THROTTLE).
  useEffect(() => {
    if (!enabled || !ch) return;
    const wait = Math.max(0, THROTTLE - (Date.now() - lastPush.current));
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, wait);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ch]);

  // Flush when leaving the sheet (unmount) and best-effort on tab close.
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
