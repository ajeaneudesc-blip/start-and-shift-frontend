import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { SelectableRow } from '../components/ui/SelectableRow';
import { OrderProgress } from '../components/tracking/OrderProgress';
import { listOrders, Order } from '../api/orders';
import { openConversation } from '../api/conversations';
import { apiErrorMessage } from '../api/client';
import {
  formatFCFA,
  MOYENS_PAIEMENT,
  PACK_IDENTITE,
} from '../constants/offers';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

export function PaymentScreen({ navigation }: AppScreenProps<'Payment'>) {
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [moyen, setMoyen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const charger = useCallback(async () => {
    try {
      const items = await listOrders();
      if (alive.current) setOrders(items);
    } catch {
      // Sans réseau on affiche quand même les explications de paiement :
      // elles ne dépendent d'aucune donnée serveur.
      if (alive.current) setOrders([]);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  /** Ouvre le fil (route idempotente) et y emmène l'utilisateur. */
  async function ouvrirDiscussion() {
    setBusy(true);
    setError(null);
    try {
      const conv = await openConversation();
      navigation.navigate('Chat', { conversationId: conv.id });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  if (orders === null) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={Colors.blueMid} />
      </View>
    );
  }

  const commande = orders[0] ?? null;

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
        accessibilityLabel="Revenir"
        style={styles.back}
      >
        <Icon name="arrow-left" size={19} />
      </Pressable>

      {commande ? (
        <>
          <Text style={styles.eyebrow}>VOTRE COMMANDE</Text>
          <View style={styles.orderBlock}>
            <OrderProgress order={commande} compact />
            <Button
              label="Suivre l'avancement"
              onPress={() => navigation.navigate('Tracking')}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.eyebrow}>PAIEMENT</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatFCFA(PACK_IDENTITE.montantFCFA)}</Text>
          </View>
          <Text style={styles.pack}>
            {PACK_IDENTITE.nom} — {PACK_IDENTITE.detail}
          </Text>

          {/*
            Le prototype simule ici un paiement complet : barre de progression,
            « Connexion à T-Money… », puis un reçu. Rien de tout cela n'existe.
            Le backend n'a aucune route de création de commande, et l'intégration
            Mobile Money attend l'enregistrement de la société. Afficher un reçu
            ferait croire à quelqu'un que ses 18 000 F sont partis alors que rien
            n'a bougé — c'est la pire chose que cette app puisse dire.

            L'écran explique donc comment le paiement se passe réellement
            aujourd'hui : un transfert ou un dépôt, que l'assistant confirme.
          */}
          <Text style={styles.sectionLabel}>COMMENT PAYER</Text>

          <View style={styles.moyens}>
            {MOYENS_PAIEMENT.map((m, i) => (
              <SelectableRow
                key={m.nom}
                label={m.nom}
                hint={m.detail}
                selected={moyen === i}
                onPress={() => setMoyen(i)}
              />
            ))}
          </View>

          <View style={styles.notice}>
            <Icon name="lock" size={17} color={Colors.textMuted} style={styles.noticeIcon} />
            <Text style={styles.noticeText}>
              {MOYENS_PAIEMENT[moyen].nom === 'Espèces au bureau'
                ? `Passez au bureau (${MOYENS_PAIEMENT[moyen].detail}) avec le montant. Votre assistant enregistre le paiement devant vous.`
                : `Votre assistant vous donne le numéro ${MOYENS_PAIEMENT[moyen].nom} dans la discussion. Vous faites le transfert avec votre code habituel, puis vous le prévenez : il confirme la réception.`}
            </Text>
          </View>

          <Text style={styles.warning}>
            Le paiement ne se fait pas encore dans l'app. Ne saisissez jamais votre code
            secret ici — personne de START AND SHIFT ne vous le demandera.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label="Ouvrir la discussion"
              onPress={ouvrirDiscussion}
              loading={busy}
            />
            <Button
              label="Comparer Gratuit et Pro"
              variant="secondary"
              onPress={() => navigation.navigate('Offers')}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
    marginBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: Colors.blueMid },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.md },
  price: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  pack: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
  },

  sectionLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: Colors.textLabel,
    marginBottom: Spacing.md,
  },
  moyens: { gap: Spacing.sm, marginBottom: Spacing.lg },

  notice: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: Spacing.md,
  },
  noticeIcon: { marginTop: 2 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.textMuted },

  warning: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.orange,
    marginBottom: Spacing.xl,
  },
  error: { fontSize: 14, color: Colors.danger, marginBottom: Spacing.md },
  actions: { gap: Spacing.md },

  orderBlock: { marginTop: Spacing.lg, gap: Spacing.lg },
});
