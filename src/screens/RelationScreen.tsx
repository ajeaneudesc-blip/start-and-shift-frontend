import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import {
  AssistantCard,
  isBeforeOpening,
  Presence,
} from '../components/relation/AssistantCard';
import { PromiseList } from '../components/relation/PromiseList';
import { Conversation, openConversation } from '../api/conversations';
import { apiErrorCode, apiErrorMessage } from '../api/client';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

export function RelationScreen({ navigation }: AppScreenProps<'Relation'>) {
  const insets = useSafeAreaInsets();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * L'heure d'ouverture est lue au rendu. Sans ce battement, l'écran resté
   * ouvert à 7 h 59 annoncerait encore « Disponible à partir de 8h » à 8 h 01,
   * et un retour depuis le chat n'y changerait rien — l'écran reste monté dans
   * la pile, donc il ne se redessine pas tout seul. Constaté en test.
   */
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /**
   * Ouvre le fil. Appelable sans précaution : la route serveur est idempotente,
   * donc un appel au montage puis un second au clic ne créent qu'une seule
   * conversation.
   */
  const open = useCallback(async (probe: boolean): Promise<Conversation | null> => {
    setBusy(true);
    setError(null);
    try {
      const conv = await openConversation(undefined, { probe });
      if (!alive.current) return null;
      setConversation(conv);
      setOffline(false);
      return conv;
    } catch (e) {
      if (!alive.current) return null;
      // Une erreur réseau est le seul signal fiable dont on dispose pour dire
      // que l'appareil ne joint pas le service : on s'en sert pour la pastille
      // de présence plutôt que d'afficher « En ligne » sans rien en savoir.
      if (apiErrorCode(e) === 'network_error') setOffline(true);
      else setError(apiErrorMessage(e));
      return null;
    } finally {
      if (alive.current) setBusy(false);
    }
  }, []);

  // On ouvre dès l'affichage : le backend documente cet appel juste après la
  // stratégie, et cela rend « Ouvrir la discussion » instantané. En mode sonde,
  // pour que la pastille de présence tranche en 8 s au plus.
  useEffect(() => {
    void open(true);
  }, [open]);

  // Ici l'utilisateur a appuyé : il a choisi d'attendre, donc politique
  // complète (15 s + 2 réessais) pour maximiser les chances sur réseau lent.
  async function goToChat() {
    const conv = conversation ?? (await open(false));
    if (conv) navigation.navigate('Chat', { conversationId: conv.id });
  }

  const presence: Presence = offline ? 'offline' : isBeforeOpening(now) ? 'closed' : 'online';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Revenir à ma stratégie"
        style={styles.back}
      >
        <Icon name="arrow-left" size={19} />
      </Pressable>

      <Text style={styles.title} accessibilityRole="header">
        Votre assistant prend le relais
      </Text>
      <Text style={styles.intro}>
        Il travaille sur votre stratégie et vous répond dans l'app, en français.
      </Text>

      <AssistantCard presence={presence} />

      <View style={styles.promises}>
        <PromiseList />
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      ) : null}

      <Button
        label={offline ? 'Réessayer' : 'Ouvrir la discussion'}
        onPress={goToChat}
        loading={busy && !conversation}
      />

      {offline ? (
        // Ne rien promettre que l'app ne tienne : la file d'attente des
        // messages hors ligne arrive à l'étape 7. Ce qui est vrai aujourd'hui,
        // c'est que le diagnostic et la stratégie sont déjà enregistrés.
        <Text style={styles.footnote}>
          Vos réponses sont enregistrées. La discussion s'ouvrira au retour du réseau.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  promises: { marginTop: Spacing.lg, marginBottom: Spacing.xl },
  error: {
    marginBottom: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.danger,
  },
  footnote: {
    marginTop: Spacing.md,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textFaint,
    textAlign: 'center',
  },
});
