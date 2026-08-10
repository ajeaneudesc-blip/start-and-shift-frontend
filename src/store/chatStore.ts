import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiErrorCode, apiErrorMessage } from '../api/client';
import { getConversation, Message, sendMessage } from '../api/conversations';

/** Message écrit par l'utilisateur, pas encore confirmé par le serveur. */
export interface PendingMessage {
  /** Identifiant local — le serveur n'en a pas encore attribué. */
  localId: string;
  text: string;
  /** Heure de rédaction, transmise telle quelle au serveur. */
  sentAt: string;
  state: 'sending' | 'queued' | 'failed';
}

interface ChatStore {
  conversationId: number | null;
  messages: Message[];
  outbox: PendingMessage[];
  loading: boolean;
  error: string | null;

  open: (conversationId: number) => Promise<void>;
  refresh: () => Promise<void>;
  receive: (msg: Message) => void;
  send: (text: string) => Promise<void>;
  flush: () => Promise<void>;
  reset: () => void;
}

const outboxKey = (id: number) => `outbox_${id}`;

const newLocalId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Fusionne sans doublon et garde l'ordre chronologique. */
function merge(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

async function readOutbox(conversationId: number): Promise<PendingMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(outboxKey(conversationId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Au rechargement, un message resté en « sending » n'a plus personne pour
    // l'envoyer : il repasse en file d'attente.
    return parsed.map((p: PendingMessage) => ({
      ...p,
      state: p.state === 'sending' ? 'queued' : p.state,
    }));
  } catch {
    return [];
  }
}

async function writeOutbox(conversationId: number, outbox: PendingMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(outboxKey(conversationId), JSON.stringify(outbox));
  } catch {
    // Stockage indisponible : la file reste en mémoire pour cette session.
  }
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversationId: null,
  messages: [],
  outbox: [],
  loading: false,
  error: null,

  open: async (conversationId) => {
    set({ conversationId, messages: [], outbox: [], loading: true, error: null });

    const outbox = await readOutbox(conversationId);
    set({ outbox });

    try {
      const conv = await getConversation(conversationId);
      set({ messages: conv.messages, loading: false });
    } catch (e) {
      // L'historique manque, mais la file locale reste affichable : hors ligne,
      // l'utilisateur voit au moins ce qu'il a écrit.
      set({ loading: false, error: apiErrorMessage(e) });
    }

    void get().flush();
  },

  /** Recharge l'historique — après une reconnexion, on a pu rater des messages. */
  refresh: async () => {
    const { conversationId } = get();
    if (conversationId === null) return;
    try {
      const conv = await getConversation(conversationId);
      set((s) => ({ messages: merge(s.messages, conv.messages), error: null }));
    } catch {
      // Sans réseau, on garde ce qui est déjà affiché.
    }
  },

  receive: (msg) => {
    set((s) => ({ messages: merge(s.messages, [msg]) }));
  },

  send: async (text) => {
    const { conversationId } = get();
    const trimmed = text.trim();
    if (conversationId === null || !trimmed) return;

    const pending: PendingMessage = {
      localId: newLocalId(),
      text: trimmed,
      sentAt: new Date().toISOString(),
      state: 'queued',
    };

    const withPending = [...get().outbox, pending];
    set({ outbox: withPending });
    // On écrit sur le disque avant de tenter le réseau : si l'app est fermée
    // pendant l'envoi, le message est retrouvé au prochain lancement.
    await writeOutbox(conversationId, withPending);

    // Passer par `flush` plutôt que d'envoyer directement : s'il reste des
    // messages en attente, ils doivent partir d'abord, sinon la discussion
    // arrive dans le désordre côté équipe.
    await get().flush();
  },

  flush: async () => {
    const { conversationId } = get();
    if (conversationId === null || flushing) return;

    flushing = true;
    try {
      // Un à la fois, dans l'ordre d'écriture.
      for (;;) {
        const next = get().outbox.find((p) => p.state === 'queued');
        if (!next) break;

        const delivered = await deliver(conversationId, next, set, get);
        // Réseau toujours coupé : inutile d'essayer les suivants, ils
        // échoueraient pareil et feraient patienter l'utilisateur pour rien.
        if (!delivered) break;
      }
    } finally {
      flushing = false;
    }
  },

  reset: () => set({ conversationId: null, messages: [], outbox: [], loading: false, error: null }),
}));

type SetState = (partial: Partial<ChatStore> | ((s: ChatStore) => Partial<ChatStore>)) => void;
type GetState = () => ChatStore;

/**
 * Garde-fou contre deux vidages simultanés : le montage de l'écran, la
 * reconnexion du WebSocket et un envoi peuvent tomber en même temps, et le même
 * message partirait deux fois.
 */
let flushing = false;

/**
 * Tente l'envoi d'un message de la file, puis met à jour son état.
 *
 * Renvoie `false` uniquement sur erreur réseau — le message reste en file et
 * repartira au prochain `flush()`. Une erreur applicative (texte refusé,
 * conversation absente) le marque « échoué » et renvoie `true` : réessayer ne
 * servirait à rien, et il ne doit pas bloquer les messages suivants.
 */
async function deliver(
  conversationId: number,
  pending: PendingMessage,
  set: SetState,
  get: GetState,
): Promise<boolean> {
  const mark = (state: PendingMessage['state']) => {
    const outbox = get().outbox.map((p) =>
      p.localId === pending.localId ? { ...p, state } : p,
    );
    set({ outbox });
    return outbox;
  };

  mark('sending');

  try {
    const saved = await sendMessage(conversationId, pending.text, pending.sentAt);
    const outbox = get().outbox.filter((p) => p.localId !== pending.localId);
    set((s) => ({ messages: merge(s.messages, [saved]), outbox }));
    await writeOutbox(conversationId, outbox);
    return true;
  } catch (e) {
    const offline = apiErrorCode(e) === 'network_error';
    const outbox = mark(offline ? 'queued' : 'failed');
    await writeOutbox(conversationId, outbox);
    return !offline;
  }
}
