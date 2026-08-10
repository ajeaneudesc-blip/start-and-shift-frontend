import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Answer, getDiagnostic, isEmpty, saveDiagnostic } from '../api/diagnostic';
import { ANSWER_COUNT } from '../constants/questions';

const DRAFT_KEY = 'diagnostic_draft';

/** `local` = enregistré sur l'appareil seulement, le serveur n'a pas répondu. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'local';

interface DiagStore {
  answers: Answer[];
  step: number;
  saveState: SaveState;
  loaded: boolean;
  setAnswer: (index: number, value: Answer) => void;
  toggleMulti: (index: number, option: string, max?: number) => void;
  goTo: (step: number) => void;
  load: () => Promise<void>;
  sync: () => Promise<boolean>;
  reset: () => Promise<void>;
}

const emptyAnswers = (): Answer[] => Array<Answer>(ANSWER_COUNT).fill(null);

const answeredCount = (answers: Answer[]): number =>
  answers.filter((a) => !isEmpty(a)).length;

/** Ramène un tableau de longueur quelconque à exactement 8 cases. */
function normalise(input: unknown): Answer[] {
  const out = emptyAnswers();
  if (!Array.isArray(input)) return out;
  for (let i = 0; i < Math.min(input.length, ANSWER_COUNT); i++) {
    const v = input[i];
    if (typeof v === 'string') out[i] = v;
    else if (Array.isArray(v)) out[i] = v.filter((x): x is string => typeof x === 'string');
  }
  return out;
}

/** Première question sans réponse — sinon la dernière. */
function firstUnanswered(answers: Answer[]): number {
  const i = answers.findIndex((a) => isEmpty(a));
  return i === -1 ? ANSWER_COUNT - 1 : i;
}

export const useDiagStore = create<DiagStore>((set, get) => ({
  answers: emptyAnswers(),
  step: 0,
  saveState: 'idle',
  loaded: false,

  setAnswer: (index, value) => {
    const answers = [...get().answers];
    answers[index] = value;
    set({ answers, saveState: 'idle' });
  },

  toggleMulti: (index, option, max) => {
    const answers = [...get().answers];
    const current = Array.isArray(answers[index]) ? [...(answers[index] as string[])] : [];
    const at = current.indexOf(option);

    if (at >= 0) {
      current.splice(at, 1);
    } else {
      // Au-delà du maximum, le plus ancien choix cède sa place : plus lisible
      // qu'un clic sans effet, qui donne l'impression que l'app est bloquée.
      if (max && current.length >= max) current.shift();
      current.push(option);
    }

    answers[index] = current;
    set({ answers, saveState: 'idle' });
  },

  goTo: (step) => set({ step: Math.max(0, Math.min(ANSWER_COUNT - 1, step)) }),

  load: async () => {
    let draft: Answer[] = emptyAnswers();
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (raw) draft = normalise(JSON.parse(raw));
    } catch {
      // Brouillon illisible : on repart d'un diagnostic vide.
    }

    let remote: Answer[] = emptyAnswers();
    try {
      const state = await getDiagnostic();
      remote = normalise(state.answers);
    } catch {
      // Hors ligne : on se contente du brouillon local.
    }

    // On garde la version la plus avancée. Le serveur ne peut pas être pris
    // comme référence absolue : une réponse saisie hors ligne n'y est pas
    // encore, et l'écraser ferait perdre du travail à l'utilisateur.
    const answers = answeredCount(draft) > answeredCount(remote) ? draft : remote;

    set({ answers, step: firstUnanswered(answers), loaded: true });
  },

  sync: async () => {
    const { answers } = get();
    set({ saveState: 'saving' });

    // Le disque d'abord : même si le réseau tombe, rien n'est perdu.
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(answers));
    } catch {
      // Stockage plein ou indisponible — on tente quand même le serveur.
    }

    try {
      await saveDiagnostic(answers);
      set({ saveState: 'saved' });
      return true;
    } catch {
      set({ saveState: 'local' });
      return false;
    }
  },

  reset: async () => {
    set({ answers: emptyAnswers(), step: 0, saveState: 'idle', loaded: false });
    await AsyncStorage.removeItem(DRAFT_KEY);
  },
}));
