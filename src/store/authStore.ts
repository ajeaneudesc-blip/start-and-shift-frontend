import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, setAuthToken, setUnauthorizedHandler } from '../api/client';
import { getMe, User } from '../api/auth';

const USER_KEY = 'user';

/**
 * L'écran de consentement a été supprimé : la mention figure désormais sous le
 * bouton de création de compte, et l'accepter revient à créer le compte. Il n'y
 * a donc plus d'état à conserver ici — la clé `consent` du stockage local des
 * versions précédentes est purgée à la restauration.
 */
const LEGACY_CONSENT_KEY = 'consent';

interface AuthStore {
  token: string | null;
  user: User | null;
  /** `false` tant que la restauration depuis le disque n'est pas terminée. */
  hydrated: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setAuth: async (token, user) => {
    setAuthToken(token);
    set({ token, user });
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
  },

  logout: async () => {
    setAuthToken(null);
    set({ token: null, user: null });
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, LEGACY_CONSENT_KEY]);
  },

  restore: async () => {
    try {
      const stored = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
      const token = stored[0]?.[1] ?? null;
      const rawUser = stored[1]?.[1] ?? null;

      // Reliquat des versions qui avaient un écran de consentement. Sans cette
      // purge, la clé resterait indéfiniment sur les appareils déjà installés.
      void AsyncStorage.removeItem(LEGACY_CONSENT_KEY);

      if (!token) return;

      setAuthToken(token);

      // On rétablit d'abord l'utilisateur mis en cache : sur réseau lent,
      // attendre GET /api/me laisserait un écran vide plusieurs secondes.
      set({ token, user: parse<User>(rawUser) });

      try {
        const fresh = await getMe();
        set({ user: fresh });
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
      } catch {
        // 401 : l'intercepteur a déjà déclenché logout(), rien à faire ici.
        // Erreur réseau : on garde la session locale, l'app reste utilisable
        // hors ligne et la prochaine requête retentera.
      }
    } finally {
      set({ hydrated: true });
    }
  },
}));

function parse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// Un 401 signifie que la session a été révoquée côté serveur : on vide l'état
// local, ce qui renvoie automatiquement l'utilisateur vers l'inscription.
setUnauthorizedHandler(() => {
  void useAuthStore.getState().logout();
});
