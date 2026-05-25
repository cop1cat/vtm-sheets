// Lazy Firebase layer. The SDK is dynamically imported on first use so it stays
// out of the main bundle. Everything here assumes cloud is configured — callers
// must guard with isCloudConfigured().
//
// Firestore layout: /users/{uid}/characters/{charId} = Character JSON.
//   read:  public  (storyteller share-link)
//   write: owner only (request.auth.uid == uid) — enforced by security rules.
import type { Character } from '@/domain/character';
import { getCloudConfig } from './config';

export interface CloudUser {
  uid: string;
  email: string | null;
  name: string | null;
  photo: string | null;
}

type Services = {
  auth: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
};

let servicesPromise: Promise<Services> | null = null;

function services(): Promise<Services> {
  if (servicesPromise) return servicesPromise;
  servicesPromise = (async () => {
    const cfg = getCloudConfig();
    if (!cfg) throw new Error('Cloud is not configured');
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { initializeFirestore, persistentLocalCache } = await import('firebase/firestore');
    const app = getApps()[0] ?? initializeApp(cfg);
    const auth = getAuth(app);
    let db: import('firebase/firestore').Firestore;
    try {
      db = initializeFirestore(app, { localCache: persistentLocalCache() });
    } catch {
      // Already initialized (e.g. HMR) — fall back to the existing instance.
      const { getFirestore } = await import('firebase/firestore');
      db = getFirestore(app);
    }
    return { auth, db };
  })();
  return servicesPromise;
}

function toUser(u: import('firebase/auth').User | null): CloudUser | null {
  return u ? { uid: u.uid, email: u.email, name: u.displayName, photo: u.photoURL } : null;
}

export async function signInWithGoogle(): Promise<CloudUser | null> {
  const { auth } = await services();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const res = await signInWithPopup(auth, new GoogleAuthProvider());
  return toUser(res.user);
}

export async function signOutCloud(): Promise<void> {
  const { auth } = await services();
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

export async function onAuthChange(cb: (user: CloudUser | null) => void): Promise<() => void> {
  const { auth } = await services();
  const { onAuthStateChanged } = await import('firebase/auth');
  return onAuthStateChanged(auth, (u) => cb(toUser(u)));
}

const charPath = (uid: string, charId: string) => ['users', uid, 'characters', charId] as const;

export async function saveRemote(uid: string, ch: Character): Promise<void> {
  const { db } = await services();
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, ...charPath(uid, ch.id)), { ...ch, updatedAt: Date.now() });
}

export async function loadRemote(uid: string, charId: string): Promise<Character | null> {
  const { db } = await services();
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, ...charPath(uid, charId)));
  return snap.exists() ? (snap.data() as Character) : null;
}

export async function deleteRemote(uid: string, charId: string): Promise<void> {
  const { db } = await services();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, ...charPath(uid, charId)));
}

/** One-shot read of all of a user's characters (login → dashboard discovery). */
export async function listRemote(uid: string): Promise<Character[]> {
  const { db } = await services();
  const { collection, getDocs } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'users', uid, 'characters'));
  return snap.docs.map((d) => d.data() as Character);
}
