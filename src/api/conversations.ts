import client, { PROBE_TIMEOUT_MS } from './client';

export type ConvStatus = 'OUVERTE' | 'EN_ATTENTE' | 'RESOLUE';

/**
 * Forme renvoyée par le backend (`listItem()` dans `routes/conversations.ts`).
 * Plusieurs champs ne servent qu'au backoffice ; on les garde pour rester
 * fidèle à la réponse plutôt que d'en typer un sous-ensemble trompeur.
 */
export interface ConversationBase {
  id: number;
  /** Nom commercial ou prénom du propriétaire. */
  client: string;
  handle: string;
  tag: string;
  status: ConvStatus;
  /** Pseudo du membre de l'équipe affecté, `null` tant que personne ne l'est. */
  assignee: string | null;
  unread: boolean;
  /** Heure déjà formatée par le serveur. */
  time: string;
  plan: 'GRATUIT' | 'PRO';
  preview: string;
}

/** Réponse de `POST /api/conversations`, qui ajoute l'indicateur de création. */
export interface Conversation extends ConversationBase {
  /** `true` si ce fil vient d'être créé, `false` s'il existait déjà. */
  created: boolean;
}

/** Qui a écrit. `equipe` = un humain du backoffice, `assistant` = le modèle. */
export type MessageFrom = 'client' | 'equipe' | 'assistant';

/**
 * Message tel que l'app le manipule.
 *
 * Le serveur formate déjà une heure (`time`) sur `GET /:id`, mais pas sur les
 * messages poussés par WebSocket. Plutôt que de gérer deux formes, on ne garde
 * que `createdAt` et l'heure est mise en forme côté app — un seul rendu, donc
 * pas de décalage visible entre un message reçu en direct et le même message
 * après rechargement.
 */
export interface Message {
  id: number;
  from: MessageFrom;
  text: string;
  createdAt: string;
}

/** Ce que renvoie le serveur, avec des champs qui ne servent pas ici. */
interface RawMessage {
  id: number;
  from: MessageFrom;
  text: string;
  createdAt: string;
}

export function toMessage(raw: RawMessage): Message {
  return { id: raw.id, from: raw.from, text: raw.text, createdAt: raw.createdAt };
}

export interface ConversationDetail extends ConversationBase {
  createdAt: string;
  messages: Message[];
}

export interface ConversationPage {
  items: ConversationBase[];
  /** Curseur de pagination, `null` quand il n'y a plus rien à charger. */
  cursor: string | null;
  unreadCount: number;
}

/**
 * `GET /api/conversations` — pour un client, le serveur restreint d'office la
 * liste à ses propres fils (le filtre est côté serveur, pas ici).
 */
export async function listConversations(): Promise<ConversationPage> {
  const { data } = await client.get<ConversationPage>('/api/conversations');
  return data;
}

/** `GET /api/conversations/:id` — le fil et **tout** son historique. */
export async function getConversation(id: number): Promise<ConversationDetail> {
  const { data } = await client.get<ConversationDetail & { messages: RawMessage[] }>(
    `/api/conversations/${id}`,
  );
  return { ...data, messages: data.messages.map(toMessage) };
}

/**
 * `POST /api/conversations/:id/messages` avec `from: "client"`.
 *
 * Pourquoi `client` et non `assistant` : envoyer `assistant` demanderait au
 * modèle de répondre immédiatement. Or `ANTHROPIC_API_KEY` est absente en
 * développement (réponse 503 `assistant_unavailable`), le chemin n'a jamais
 * été testé contre l'API réelle, et le produit promet « une première
 * proposition sous 48 h » — donc une réponse humaine. Un message `client`
 * part au backoffice, ce qui correspond à cette promesse.
 *
 * Basculer sur l'assistant IA se fait en changeant ce seul champ.
 *
 * `sentAt` sert à la file d'attente hors ligne : le serveur accepte un
 * horodatage client s'il est plausible (pas plus de 7 jours dans le passé, pas
 * plus d'une minute dans le futur), sinon il retombe sur l'heure serveur.
 */
export async function sendMessage(
  conversationId: number,
  text: string,
  sentAt?: string,
): Promise<Message> {
  const { data } = await client.post<{ msg: RawMessage }>(
    `/api/conversations/${conversationId}/messages`,
    { text, from: 'client', ...(sentAt ? { sentAt } : {}) },
  );
  return toMessage(data.msg);
}

/** Tag par défaut côté serveur — la première conversation porte sur l'identité. */
export const DEFAULT_TAG = 'Identité';

/**
 * `POST /api/conversations` — ouvre le fil, ou renvoie celui qui existe déjà.
 *
 * **La route est idempotente** : un fil non résolu portant le même `tag` est
 * renvoyé tel quel (200, `created: false`), une vraie création répond 201 avec
 * `created: true`. Les appels concurrents du même compte sont sérialisés par un
 * verrou consultatif Postgres.
 *
 * On peut donc l'appeler sans précaution : au montage de l'écran, après un
 * double appui, ou à la reconnexion. Inutile de mémoriser l'identifiant pour
 * éviter les doublons — c'est le serveur qui s'en charge.
 */
export interface OpenOptions {
  /**
   * Mode « sonde » : 8 s, sans réessai. À utiliser pour l'appel automatique du
   * montage, dont le résultat pilote la pastille de présence — un verdict lent
   * y serait pire qu'un verdict rapide et corrigeable.
   *
   * Laisser à `false` quand c'est l'utilisateur qui a appuyé : il a choisi
   * d'attendre, autant lui laisser le bénéfice des réessais sur un réseau lent
   * mais vivant.
   */
  probe?: boolean;
}

export async function openConversation(
  tag?: string,
  options: OpenOptions = {},
): Promise<Conversation> {
  const { data } = await client.post<Conversation>(
    '/api/conversations',
    tag ? { tag } : {},
    options.probe ? { timeout: PROBE_TIMEOUT_MS, noRetry: true } : undefined,
  );
  return data;
}
