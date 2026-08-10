import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, setAuthToken, setUnauthorizedHandler } from '../api/client';
import { getMe, User } from '../api/auth';

const USER_KEY = 'user';
const CONSENT_KEY = 'consent';

/**
 * Les trois cases de l'écran de consentement. Seule la première est
 * obligatoire ; les deux autres sont des préférences.
 *
 * Le backend n'expose aucune route pour les stocker : elles restent donc sur
 * l'appareil. À reprendre quand le juriste aura tranché sur ce qui doit être
 * conservé côté serveur et sous quelle forme (preuve horodatée, retrait…).
 */
export type Consent = [boolean, boolean, boolean];

interface AuthStore {
  token: string | null;
  user: User | null;
  consent: Consent | null;
  /** `false` tant que la restauration depuis le disque n'est pas terminée. */
  hydrated: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  setConsent: (consent: Consent) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  consent: null,
  hydrated: false,

  setAuth: async (token, user) => {
    setAuthToken(token);
    set({ token, user });
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ]);
  },

  setConsent: async (consent) => {
    set({ consent });
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  },

  logout: async () => {
    setAuthToken(null);
    set({ token: null, user: null, consent: null });
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, CONSENT_KEY]);
  },

  restore: async () => {
    try {
      const stored = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY, CONSENT_KEY]);
      const token = stored[0]?.[1] ?? null;
      const rawUser = stored[1]?.[1] ?? null;
      const rawConsent = stored[2]?.[1] ?? null;

      set({ consent: parse<Consent>(rawConsent) });

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

/** L'utilisateur a-t-il accepté la case obligatoire ? */
export const hasRequiredConsent = (consent: Consent | null): boolean => consent?.[0] === true;

// Un 401 signifie que la session a été révoquée côté serveur : on vide l'état
// local, ce qui renvoie automatiquement l'utilisateur vers l'inscription.
setUnauthorizedHandler(() => {
  void useAuthStore.getState().logout();
});
