/**
 * Firebase app initialization — the single place the SDK is wired up.
 *
 * Exposes the shared `auth` and `db` handles plus the Google auth provider.
 * Offline persistence is enabled here so tasks/timer edits survive being
 * offline and sync on reconnect (multi-tab safe).
 */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

/**
 * Firestore with offline persistence. `persistentLocalCache` caches documents
 * in IndexedDB; `persistentMultipleTabManager` keeps multiple tabs in sync.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { isFirebaseConfigured };
