// App-wide auth state. When cloud isn't configured, this is inert (configured:
// false, user: null) and the app runs purely local.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isCloudConfigured } from './config';
import { onAuthChange, signInWithGoogle, signOutCloud, type CloudUser } from './firebase';

interface AuthValue {
  configured: boolean;
  ready: boolean;
  user: CloudUser | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isCloudConfigured();
  const [user, setUser] = useState<CloudUser | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    let unsub: (() => void) | undefined;
    onAuthChange((u) => { if (alive) { setUser(u); setReady(true); } })
      .then((fn) => { if (alive) unsub = fn; else fn(); }) // unsubscribe if already unmounted
      .catch(() => { if (alive) setReady(true); });
    return () => { alive = false; unsub?.(); };
  }, [configured]);

  const signIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('sign-in failed', e);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutCloud().catch(() => {});
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ configured, ready, user, signIn, signOut }),
    [configured, ready, user, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
