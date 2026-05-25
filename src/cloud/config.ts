// Cloud config from Vite env (baked at build time). Public Firebase web config
// is safe to expose; we still keep it in env so it isn't committed and can be
// injected per-environment in CI. No client secret is ever used (Google popup
// auth doesn't need one). When unset, the app runs fully local/offline.

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const env = import.meta.env;

let cached: FirebaseConfig | null | undefined;

export function getCloudConfig(): FirebaseConfig | null {
  if (cached !== undefined) return cached;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !appId) {
    cached = null;
    return null;
  }
  cached = {
    apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId,
  };
  return cached;
}

export function isCloudConfigured(): boolean {
  return getCloudConfig() !== null;
}
