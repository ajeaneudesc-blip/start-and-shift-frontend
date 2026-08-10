import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { Composer } from '../components/chat/Composer';
import { ConversationList } from '../components/chat/ConversationList';
import { MessageBubble } from '../components/chat/MessageBubble';
import { useWebSocket, WsStatus } from '../hooks/useWebSocket';
import { usePlatform } from '../hooks/usePlatform';
import { useChatStore } from '../store/chatStore';
import { ConversationBase, listConversations, Message } from '../api/conversations';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

/** Un élément de la liste : soit un message confirmé, soit un message en file. */
type Row =
  | { kind: 'sent'; key: string; text: string; mine: boolean; createdAt: string }
  | {
      kind: 'pending';
      key: string;
      text: string;
      createdAt: string;
      state: 'sending' | 'queued' | 'failed';
    };

export function ChatScreen({ navigation, route }: AppScreenProps<'Chat'>) {
  const insets = useSafeAreaInsets();
  const { isWide } = usePlatform();
  const { conversationId } = route.params;

  const messages = useChatStore((s) => s.messages);
  const outbox = useChatStore((s) => s.outbox);
  const loading = useChatStore((s) => s.loading);
  const error = useChatStore((s) => s.error);
  const open = useChatStore((s) => s.open);
  const refresh = useChatStore((s) => s.refresh);
  const receive = useChatStore((s) => s.receive);
  const send = useChatStore((s) => s.send);
  const flush = useChatStore((s) => s.flush);
  const reset = useChatStore((s) => s.reset);

  const [sidebar, setSidebar] = useState<ConversationBase[]>([]);

  useEffect(() => {
    void open(conversationId);
    return () => reset();
  }, [conversationId, open, reset]);

  // La colonne latérale n'existe que sur web large : inutile d'appeler la
  // liste ailleurs, ce serait une requête pour rien sur un forfait mobile.
  useEffect(() => {
    if (!isWide) return;
    let cancelled = false;
    void listConversations()
      .then((page) => {
        if (!cancelled) setSidebar(page.items);
      })
      .catch(() => {
        // La colonne reste vide, le fil courant s'affiche quand même.
      });
    return () => {
      cancelled = true;
    };
  }, [isWide]);

  const onMessage = useCallback((msg: Message) => receive(msg), [receive]);

  const { status, markRead } = useWebSocket({ conversationId, onMessage });

  // À la (re)connexion : rattraper ce qu'on a manqué pendant la coupure, vider
  // la file d'attente, puis signaler que le fil est lu.
  const previousStatus = useRef<WsStatus>('connecting');
  useEffect(() => {
    if (status === 'open' && previousStatus.current !== 'open') {
      void refresh();
      void flush();
      markRead();
    }
    previousStatus.current = status;
  }, [status, refresh, flush, markRead]);

  // Filet de sécurité. Le vidage de la file est normalement déclenché par la
  // reconnexion du WebSocket. Mais si celui-ci reste ouvert alors que les
  // requêtes HTTP échouent — proxy capricieux, réseau à moitié rétabli — rien
  // ne relancerait les messages en attente. On réessaie donc tant qu'il en
  // reste, et l'intervalle s'arrête de lui-même une fois la file vide.
  const hasQueued = outbox.some((p) => p.state === 'queued');
  useEffect(() => {
    if (!hasQueued) return;
    const id = setInterval(() => void flush(), 15_000);
    return () => clearInterval(id);
  }, [hasQueued, flush]);

  const rows = useMemo<Row[]>(() => {
    const sent: Row[] = messages.map((m) => ({
      kind: 'sent',
      key: `m${m.id}`,
      text: m.text,
      mine: m.from === 'client',
      createdAt: m.createdAt,
    }));

    const queued: Row[] = outbox.map((p) => ({
      kind: 'pending',
      key: `p${p.localId}`,
      text: p.text,
      createdAt: p.sentAt,
      state: p.state,
    }));

    // `inverted` sur la liste : on fournit du plus récent au plus ancien.
    return [...sent, ...queued].reverse();
  }, [messages, outbox]);

  const thread = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: isWide ? Spacing.lg : insets.top + Spacing.sm }]}>
        {!isWide ? (
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Revenir"
            style={styles.back}
          >
            <Icon name="arrow-left" size={19} />
          </Pressable>
        ) : null}

        <View style={styles.avatar}>
          <Icon name="palette" size={17} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.headerName}>Assistant</Text>
          <ConnectionLabel status={status} />
        </View>

        <Pressable
          onPress={() => navigation.navigate('Library')}
          accessibilityRole="button"
          accessibilityLabel="Voir les modèles"
          style={({ pressed }) => [styles.payButton, pressed && styles.payPressed]}
        >
          <Text style={styles.payLabel}>Modèles</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Payment')}
          accessibilityRole="button"
          accessibilityLabel="Voir le paiement"
          style={({ pressed }) => [styles.payButton, pressed && styles.payPressed]}
        >
          <Text style={styles.payLabel}>Payer</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.blueMid} />
        </View>
      ) : (
        <FlatList
          data={rows}
          inverted
          keyExtractor={(row) => row.key}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Écrivez votre premier message. L'assistant vous répond dans l'app.
              </Text>
            </View>
          }
          renderItem={({ item }) =>
            item.kind === 'sent' ? (
              <MessageBubble text={item.text} mine={item.mine} createdAt={item.createdAt} />
            ) : (
              <MessageBubble
                text={item.text}
                mine
                createdAt={item.createdAt}
                pending={item.state}
              />
            )
          }
        />
      )}

      {error && messages.length === 0 ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <View style={{ paddingBottom: insets.bottom + Spacing.md }}>
        {/*
          `key` sur le brouillon : revenir de la bibliothèque ne remonte pas cet
          écran (il est déjà dans la pile), donc sans cela le message préparé
          n'apparaîtrait jamais.
        */}
        <Composer
          key={route.params.draft ?? 'composer'}
          onSend={send}
          disabled={loading}
          initialText={route.params.draft}
        />
      </View>
    </KeyboardAvoidingView>
  );

  if (!isWide) return <View style={styles.flex}>{thread}</View>;

  return (
    <View style={[styles.flex, styles.split]}>
      <ConversationList
        items={sidebar}
        activeId={conversationId}
        onSelect={(id) => navigation.setParams({ conversationId: id })}
      />
      <View style={styles.flex}>{thread}</View>
    </View>
  );
}

function ConnectionLabel({ status }: { status: WsStatus }) {
  const config = {
    open: { label: 'En ligne', color: '#5FD08C' },
    connecting: { label: 'Connexion…', color: Colors.textFaint },
    closed: { label: 'Hors ligne — messages gardés', color: Colors.orange },
  }[status];

  return (
    <View style={styles.presenceRow} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.presence, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  split: { flexDirection: 'row' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: {
    width: 40,
    height: 40,
    marginLeft: -Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  headerName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  presence: { fontSize: 12 },
  payButton: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  payPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  payLabel: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },

  // Pas de `justifyContent` ici : la liste est `inverted`, donc son conteneur
  // est retourné et le début de contenu correspond déjà au bas de l'écran.
  // Forcer `flex-end` renvoyait les messages tout en haut.
  list: { padding: Spacing.lg, flexGrow: 1 },
  empty: {
    // La liste est inversée : sans ce retournement, le texte s'afficherait
    // à l'envers.
    transform: [{ scaleY: -1 }],
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textFaint,
    textAlign: 'center',
    maxWidth: 300,
  },
  error: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    fontSize: 13,
    color: Colors.danger,
    textAlign: 'center',
  },
});
