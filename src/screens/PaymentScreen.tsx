import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { SelectableRow } from '../components/ui/SelectableRow';
import { OrderProgress } from '../components/tracking/OrderProgress';
import { listOrders, Order } from '../api/orders';
import { openConversation } from '../api/conversations';
import { apiErrorCode, apiErrorField, apiErrorMessage } from '../api/client';
import {
  digitsOnly,
  formatLocalPhone,
  isValidLocalPhone,
  PHONE_LOCAL_LENGTH,
  PHONE_PREFIX,
  toE164,
} from '../api/auth';
import { getPaymentStatus, initiatePayment, PaygateNetwork, PaymentRequestRow } from '../api/payments';
import { useAuthStore } from '../store/authStore';
import {
  formatFCFA,
  MOYENS_PAIEMENT,
  PACK_IDENTITE,
} from '../constants/offers';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

/** Index dans `MOYENS_PAIEMENT` : les deux premiers sont les réseaux PayGate. */
const NETWORK_BY_MOYEN: Record<number, PaygateNetwork> = { 0: 'TMONEY', 1: 'FLOOZ' };

/** 3 s : assez réactif pour une confirmation qui arrive en quelques secondes, sans matraquer le serveur. */
const POLL_INTERVAL_MS = 3000;

/**
 * L'identifiant de la demande en cours survit au démontage de l'écran. Sans
 * ça, revenir en arrière ou ouvrir la discussion pendant l'attente le perdait
 * définitivement : le paiement continuait chez PayGate, mais l'app ne pouvait
 * plus le suivre et proposait d'en relancer un second.
 */
const PENDING_KEY = 'payment.pending.identifier';

const FAILURE_TEXT: Record<'ECHEC' | 'EXPIRE' | 'ANNULE', string> = {
  ECHEC: 'Le paiement a échoué. Vérifiez votre solde et réessayez.',
  EXPIRE: 'La demande a expiré sans confirmation. Réessayez.',
  ANNULE: 'Le paiement a été annulé. Réessayez si besoin.',
};

function paymentErrorMessage(e: unknown): string {
  const code = apiErrorCode(e);
  if (code?.startsWith('payment_provider_unavailable')) {
    return 'Le paiement en ligne est momentanément indisponible. Choisissez un autre moyen ci-dessous.';
  }
  if (code === 'paygate_rejected') {
    return "Le paiement n'a pas pu être lancé. Réessayez dans un instant.";
  }
  return apiErrorMessage(e);
}

export function PaymentScreen({ navigation }: AppScreenProps<'Payment'>) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [moyen, setMoyen] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Numéro pré-rempli avec celui du compte : c'est le cas le plus courant,
  // mais le client peut payer depuis un autre numéro Mobile Money.
  const [phone, setPhone] = useState(() => (user?.phone ?? '').replace(PHONE_PREFIX, ''));
  const [phoneError, setPhoneError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [request, setRequest] = useState<PaymentRequestRow | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Reprend une demande laissée en attente lors d'une visite précédente. Le
  // sondage ci-dessous redémarre tout seul dès que l'état est réhydraté.
  useEffect(() => {
    (async () => {
      const identifier = await AsyncStorage.getItem(PENDING_KEY);
      if (!identifier) return;
      try {
        const fresh = await getPaymentStatus(identifier);
        if (alive.current) setRequest(fresh);
        if (fresh.status !== 'EN_ATTENTE') await AsyncStorage.removeItem(PENDING_KEY);
      } catch {
        // Demande introuvable (404) ou API injoignable : on n'efface rien, une
        // panne réseau ne doit pas faire perdre la trace d'un paiement en cours.
      }
    })();
  }, []);

  // Sonde le statut tant que la demande est EN_ATTENTE ; s'arrête d'elle-même
  // sur un statut terminal ou si l'écran est démonté.
  // Dépendances réduites à l'identifiant et au statut : `request` change
  // d'identité à chaque sondage, l'y mettre relancerait l'intervalle tous les
  // 3 s et ferait dépendre la cadence de la latence réseau.
  const pending = request?.status === 'EN_ATTENTE' ? request.identifier : null;
  useEffect(() => {
    if (!pending) return;

    const timer = setInterval(async () => {
      try {
        const fresh = await getPaymentStatus(pending);
        if (fresh.status !== 'EN_ATTENTE') await AsyncStorage.removeItem(PENDING_KEY);
        if (alive.current) setRequest(fresh);
      } catch {
        // Panne transitoire de notre API (pas de PayGate, déjà géré côté
        // serveur) : on retente au prochain tick sans rien afficher.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [pending]);

  function choisirMoyen(i: number) {
    if (paying || request) return; // pas de changement de réseau en cours de demande
    setMoyen(i);
    setPayError(null);
  }

  async function payer() {
    const network = NETWORK_BY_MOYEN[moyen];
    if (!network) return;

    if (!isValidLocalPhone(phone)) {
      setPhoneError(true);
      setPayError(`Le numéro doit avoir ${PHONE_LOCAL_LENGTH} chiffres.`);
      return;
    }
    setPhoneError(false);
    setPayError(null);
    setPaying(true);
    try {
      const created = await initiatePayment({
        network,
        phoneNumber: toE164(phone),
        amountFCFA: PACK_IDENTITE.montantFCFA,
        description: PACK_IDENTITE.nom,
      });
      await AsyncStorage.setItem(PENDING_KEY, created.identifier);
      if (alive.current) setRequest(created);
    } catch (e) {
      // Un 503 arrive avec l'identifiant de la demande : PayGate a peut-être
      // reçu l'appel malgré la panne de transport, la demande reste EN_ATTENTE
      // côté serveur. On la mémorise pour pouvoir la retrouver plutôt que d'en
      // relancer une seconde à l'aveugle.
      const orphan = apiErrorField(e, 'identifier');
      if (orphan) await AsyncStorage.setItem(PENDING_KEY, orphan);
      if (alive.current) setPayError(paymentErrorMessage(e));
    } finally {
      if (alive.current) setPaying(false);
    }
  }

  // Uniquement après une issue terminale : tant que la demande est EN_ATTENTE,
  // l'oublier côté client n'annule rien côté PayGate. Le prompt reste posé sur
  // le téléphone, et relancer un paiement en enverrait un second pour la même
  // commande — deux débits possibles, dont un que l'app ne suivrait plus.
  async function recommencer() {
    setRequest(null);
    setPayError(null);
    await AsyncStorage.removeItem(PENDING_KEY);
  }

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
  const network = NETWORK_BY_MOYEN[moyen];

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
                onPress={() => choisirMoyen(i)}
                disabled={paying || (request !== null && i !== moyen)}
              />
            ))}
          </View>

          {network && request?.status === 'EN_ATTENTE' ? (
            <View style={styles.notice}>
              <ActivityIndicator color={Colors.blueMid} style={styles.noticeIcon} />
              <Text style={styles.noticeText}>
                Confirmez avec votre code {MOYENS_PAIEMENT[moyen].nom} habituel, sur votre téléphone.
                Cette page se met à jour dès que c'est fait.
              </Text>
            </View>
          ) : network && request?.status === 'REUSSI' ? (
            <View style={styles.notice}>
              <Icon name="check" size={17} color={Colors.blueMid} style={styles.noticeIcon} />
              <Text style={styles.noticeText}>
                Paiement reçu. Votre assistant valide votre commande sous peu.
              </Text>
            </View>
          ) : network && request && request.status !== 'EN_ATTENTE' && request.status !== 'REUSSI' ? (
            <View style={styles.notice}>
              <Icon name="close" size={17} color={Colors.orange} style={styles.noticeIcon} />
              <Text style={styles.noticeText}>{FAILURE_TEXT[request.status]}</Text>
            </View>
          ) : network ? (
            <>
              <View style={styles.notice}>
                <Icon name="lock" size={17} color={Colors.textMuted} style={styles.noticeIcon} />
                <Text style={styles.noticeText}>
                  Nous envoyons une demande sur ce numéro : confirmez avec votre code{' '}
                  {MOYENS_PAIEMENT[moyen].nom} habituel, directement sur votre téléphone.
                </Text>
              </View>
              <Input
                label="Numéro à débiter"
                prefix={PHONE_PREFIX}
                value={formatLocalPhone(phone)}
                onChangeText={(v) => {
                  setPhone(digitsOnly(v).slice(0, PHONE_LOCAL_LENGTH));
                  setPhoneError(false);
                }}
                placeholder="90 00 00 00"
                keyboardType="number-pad"
                error={phoneError ? ' ' : null}
                style={styles.phoneInput}
              />
            </>
          ) : (
            <View style={styles.notice}>
              <Icon name="lock" size={17} color={Colors.textMuted} style={styles.noticeIcon} />
              <Text style={styles.noticeText}>
                Passez au bureau ({MOYENS_PAIEMENT[moyen].detail}) avec le montant. Votre assistant
                enregistre le paiement devant vous.
              </Text>
            </View>
          )}

          {!network && (
            <Text style={styles.warning}>
              Le paiement ne se fait pas encore dans l'app. Ne saisissez jamais votre code
              secret ici — personne de START AND SHIFT ne vous le demandera.
            </Text>
          )}

          {payError ? <Text style={styles.error}>{payError}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            {network && !request ? (
              <Button
                label={`Payer via ${MOYENS_PAIEMENT[moyen].nom}`}
                onPress={payer}
                loading={paying}
              />
            ) : network && request?.status === 'EN_ATTENTE' ? (
              // Aucune action pendant l'attente : le prompt est posé sur le
              // téléphone du client et rien ici ne peut l'annuler chez PayGate.
              // Un bouton « Recommencer » ne ferait qu'en envoyer un second,
              // avec deux débits possibles à la clé. La demande finit toujours
              // par expirer côté fournisseur si personne ne confirme.
              null
            ) : network && request && request.status !== 'REUSSI' ? (
              <Button label="Réessayer" onPress={recommencer} />
            ) : null}

            <Button
              label="Ouvrir la discussion"
              variant={network && !request ? 'secondary' : 'primary'}
              onPress={ouvrirDiscussion}
              loading={busy}
            />
            {(!request || request.status !== 'EN_ATTENTE') && (
              <Button
                label="Comparer Gratuit et Pro"
                variant="secondary"
                onPress={() => navigation.navigate('Offers')}
              />
            )}
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
  phoneInput: { marginBottom: Spacing.md },

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
