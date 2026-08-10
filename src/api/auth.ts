import client from './client';

export type UserRole = 'CLIENT' | 'DESIGNER' | 'MANAGER' | 'SUPPORT' | 'VIEWER' | 'ADMIN';
export type UserPlan = 'GRATUIT' | 'PRO';
export type UserStatus = 'ACTIF' | 'INVITE' | 'SUSPENDU';

/** Miroir du modèle `User` de Prisma — il ne contient aucun secret. */
export interface User {
  id: number;
  firstName: string;
  raisonSociale: string | null;
  pseudo: string;
  phone: string;
  role: UserRole;
  plan: UserPlan;
  status: UserStatus;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface SessionResponse {
  token: string;
  user: User;
}

export interface CreateSessionInput {
  /** Format E.164 attendu par le backend : `+228` suivi de 8 chiffres. */
  phone: string;
  /** Obligatoires seulement à la première connexion de ce numéro. */
  firstName?: string;
  pseudo?: string;
}

/**
 * `POST /api/auth/session` — inscription ET connexion en une seule route.
 * Si le numéro existe déjà, le compte est retrouvé et `firstName`/`pseudo`
 * sont ignorés ; sinon le compte est créé et les deux deviennent obligatoires.
 * Réponse 201 `{ token, user }`.
 */
export async function createSession(input: CreateSessionInput): Promise<SessionResponse> {
  const { data } = await client.post<SessionResponse>('/api/auth/session', input);
  return data;
}

/** `GET /api/me` — sert à valider un token conservé entre deux lancements. */
export async function getMe(): Promise<User> {
  const { data } = await client.get<{ user: User }>('/api/me');
  return data.user;
}

/**
 * `DELETE /api/auth/session` — supprime la ligne `Session` côté serveur, ce qui
 * révoque le token immédiatement, WebSocket compris. Les autres sessions du
 * même compte survivent. Pas encore branché à un bouton (étape ultérieure).
 */
export async function deleteSession(): Promise<void> {
  await client.delete('/api/auth/session');
}

export const PHONE_PREFIX = '+228';
export const PHONE_LOCAL_LENGTH = 8;

/** Ne garde que les chiffres — l'utilisateur peut taper « 90 00 00 00 ». */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidLocalPhone(input: string): boolean {
  return digitsOnly(input).length === PHONE_LOCAL_LENGTH;
}

/** « 90 00 00 00 » → « +22890000000 ». */
export function toE164(localPhone: string): string {
  return PHONE_PREFIX + digitsOnly(localPhone);
}

/** Affichage aéré pendant la saisie : « 90 00 00 00 ». */
export function formatLocalPhone(input: string): string {
  const d = digitsOnly(input).slice(0, PHONE_LOCAL_LENGTH);
  return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}
