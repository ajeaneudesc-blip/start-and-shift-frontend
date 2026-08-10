import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { OrderProgress } from '../components/tracking/OrderProgress';
import { listOrders, Order } from '../api/orders';
import { openConversation } from '../api/conversations';
import { apiErrorMessage } from '../api/client';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

export function TrackingScreen({ navigation }: AppScreenProps<'Tracking'>) {
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const charger = useCallback(async () => {
    setError(null);
    try {
      const items = await listOrders();
      if (alive.current) setOrders(items);
    } catch (e) {
      if (alive.current) {
        setOrders([]);
        setError(apiErrorMessage(e));
      }
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function ouvrirDiscussion() {
    setBusy(true);
    try {
      const conv = await openConversation();
      navigation.navigate('Chat', { conversationId: conv.id });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Revenir"
          style={styles.iconButton}
        >
          <Icon name="arrow-left" size={19} />
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">
          Suivi
        </Text>

        <Pressable
          onPress={() => void charger()}
          accessibilityRole="button"
          accessibilityLabel="Actualiser"
          style={[styles.iconButton, styles.bordered]}
        >
          <Icon name="refresh" size={18} />
        </Pressable>
      </View>

      {orders === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.blueMid} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Aucune commande pour l'instant.</Text>
              <Text style={styles.emptyBody}>
                Votre commande apparaîtra ici dès que votre assistant aura confirmé le
                paiement.
              </Text>
              <Button
                label="Voir le paiement"
                variant="secondary"
                onPress={() => navigation.navigate('Payment')}
                style={styles.emptyCta}
              />
            </View>
          ) : (
            <View style={styles.list}>
              {orders.map((order) => (
                <OrderProgress key={order.ref} order={order} />
              ))}

              <Button
                label="Poser une question à l'assistant"
                variant="secondary"
                onPress={ouvrirDiscussion}
                loading={busy}
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: { borderWidth: 1, borderColor: Colors.borderStrong },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  scroll: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  list: { gap: Spacing.lg },
  error: { fontSize: 13, color: Colors.danger, marginBottom: Spacing.md },

  empty: { gap: Spacing.md, paddingTop: Spacing.xxl },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyBody: { fontSize: 15, lineHeight: 22, color: Colors.textMuted },
  emptyCta: { marginTop: Spacing.md },
});
