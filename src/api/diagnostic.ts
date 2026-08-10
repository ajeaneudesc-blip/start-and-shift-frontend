import client from './client';
import { ANSWER_COUNT } from '../constants/questions';

/**
 * Une réponse : texte pour `one`/`free`, tableau pour `multi`, `null` tant que
 * la question n'a pas été traitée.
 */
export type Answer = string | string[] | null;

export interface DiagnosticState {
  answers: Answer[] | null;
  completedAt: string | null;
}

export interface DiagnosticSaved {
  answers: Answer[];
  completedAt: string;
  /** `true` quand les 8 réponses sont présentes et non vides côté serveur. */
  complete: boolean;
}

/** `GET /api/diagnostic` — `answers` vaut `null` avant toute sauvegarde. */
export async function getDiagnostic(): Promise<DiagnosticState> {
  const { data } = await client.get<DiagnosticState>('/api/diagnostic');
  return data;
}

/**
 * `PUT /api/diagnostic` — accepte un tableau partiel, ce qui permet
 * d'enregistrer au fil de l'eau. Le serveur refuse plus de 8 réponses et ne
 * fait avancer `completedAt` que sur une soumission complète.
 */
export async function saveDiagnostic(answers: Answer[]): Promise<DiagnosticSaved> {
  const { data } = await client.put<DiagnosticSaved>('/api/diagnostic', {
    answers: toPayload(answers),
  });
  return data;
}

/**
 * Le store garde toujours 8 cases (avec des `null`), mais le backend juge la
 * complétude sur la LONGUEUR du tableau reçu. Envoyer 8 cases dont 5 à `null`
 * ferait échouer la validation ; on n'envoie donc que le préfixe réellement
 * rempli.
 *
 * Attention au détail : côté serveur, un tableau vide `[]` n'est ni `null` ni
 * `""`, donc il compterait comme « répondu ». C'est l'écran qui doit interdire
 * de valider une question `multi` sans aucun choix.
 */
export function toPayload(answers: Answer[]): Answer[] {
  let last = -1;
  for (let i = 0; i < answers.length; i++) {
    if (!isEmpty(answers[i])) last = i;
  }
  return answers.slice(0, last + 1);
}

export function isEmpty(a: Answer): boolean {
  if (a === null || a === undefined) return true;
  if (Array.isArray(a)) return a.length === 0;
  return a.trim() === '';
}

/** Les 8 réponses sont-elles présentes ? Miroir exact du contrôle serveur. */
export function isComplete(answers: Answer[]): boolean {
  return answers.length === ANSWER_COUNT && answers.every((a) => !isEmpty(a));
}
