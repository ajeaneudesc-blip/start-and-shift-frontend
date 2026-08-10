import client from './client';

/**
 * Réponse de `POST /api/strategy`.
 *
 * Le backend produit aussi un `productMarketing` (document de cadrage), qu'il
 * ne renvoie **jamais** au client : il reste en base et alimente le prompt de
 * l'assistant. Ne pas essayer de le lire ici.
 */
export interface Strategy {
  /** Positionnement : une phrase. */
  pos: string;
  /** Publics prioritaires, 3 au maximum. */
  cibles: string[];
  /** Ton, en une phrase. */
  ton: string;
  /** Ce qui différencie — la phrase à répéter partout. */
  diff: string;
  /** Exactement trois actions. */
  actions: string[];
}

/**
 * `POST /api/strategy` — calcul **synchrone** côté serveur
 * (`src/services/strategy.ts` est une fonction pure, sans IA ni réseau).
 *
 * Il n'y a donc rien à sonder : le sondage toutes les 2 s décrit dans
 * FRONTEND_SPEC §6.4 n'a pas d'objet, un seul appel renvoie le résultat.
 *
 * Erreurs possibles : 400 `diagnostic_missing` (aucune réponse enregistrée),
 * 400 `diagnostic_incomplete` (moins de 8 réponses, avec `expected`/`actual`).
 */
export async function generateStrategy(): Promise<Strategy> {
  const { data } = await client.post<Strategy>('/api/strategy');
  return data;
}
