import client, { PROBE_TIMEOUT_MS } from './client';

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

export interface RequestOtpInput {
  /** Format E.164 attendu par le backend : `+228` suivi de 8 chiffres. */
  phone: string;
  /** Obligatoires seulement à la première connexion de ce numéro. */
  firstName?: string;
  pseudo?: string;
}

/**
 * Deux issues possibles, distinguées par `verified` :
 *
 * - `true` — la session est ouverte séance tenante. C'est le parcours client :
 *   le numéro n'est qu'une information de contact, aucun code n'est envoyé.
 * - `false` — un code a été envoyé, il faut passer par `verifyOtp`. Réservé
 *   aux rôles équipe, dont l'accès ouvre les conversations et les fiches
 *   clients : un numéro connu n'y suffit pas.
 */
export type RequestSessionResponse =
  | ({ verified: true } & SessionResponse)
  | { verified: false; sessionToken: string; expiresIn: number };

/**
 * `POST /api/auth/session/request`. Si le numéro est inconnu,
 * `firstName`/`pseudo` deviennent obligatoires — le compte est alors créé ici
 * même pour un client, puisqu'il n'y a plus d'étape de vérification.
 */
export async function requestSession(input: RequestOtpInput): Promise<RequestSessionResponse> {
  const { data } = await client.post<RequestSessionResponse>('/api/auth/session/request', input);
  return data;
}

/**
 * `POST /api/auth/session/verify` — crée le compte si besoin et ouvre la
 * session. Réponse 201 `{ token, user }`.
 */
export async function verifyOtp(sessionToken: string, otp: string): Promise<SessionResponse> {
  const { data } = await client.post<SessionResponse>('/api/auth/session/verify', { sessionToken, otp });
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

/**
 * `GET /api/ws-ticket` — ticket à usage unique, valable 30 s, à passer en query
 * string du WebSocket.
 *
 * Le JWT ne transite jamais dans l'URL d'un socket : elle atterrit dans les
 * journaux du serveur, ceux des proxys traversés et l'historique du navigateur,
 * où un jeton de sept jours resterait exploitable. Le ticket, lui, est détruit
 * dès qu'il sert.
 *
 * Sans réessai et en délai court : le hook `useWebSocket` a déjà sa propre
 * temporisation, et empiler les deux retarderait la connexion de plusieurs
 * dizaines de secondes.
 */
export async function getWsTicket(): Promise<string> {
  const { data } = await client.get<{ ticket: string; expiresIn: number }>('/api/ws-ticket', {
    timeout: PROBE_TIMEOUT_MS,
    noRetry: true,
  });
  return data.ticket;
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
