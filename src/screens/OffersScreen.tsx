import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import {
  COMPARATIF,
  formatFCFA,
  OFFRE_GRATUITE,
  OFFRE_PRO,
} from '../constants/offers';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

export function OffersScreen({ navigation }: AppScreenProps<'Offers'>) {
  const insets = useSafeAreaInsets();

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

      <Text style={styles.title} accessibilityRole="header">
        Gratuit ou Pro
      </Text>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>GRATUIT</Text>
          <Text style={styles.cardPrice}>{formatFCFA(OFFRE_GRATUITE.montantFCFA)}</Text>
          <Text style={styles.cardDetail}>{OFFRE_GRATUITE.duree}</Text>
        </View>

        <View style={[styles.card, styles.cardPro]}>
          <Text style={[styles.cardLabel, styles.cardLabelPro]}>PRO</Text>
          <Text style={styles.cardPrice}>{formatFCFA(OFFRE_PRO.montantFCFA)}</Text>
          <Text style={[styles.cardDetail, styles.cardDetailPro]}>{OFFRE_PRO.duree}</Text>
        </View>
      </View>

      <View style={styles.table}>
        {/* En-tête de colonnes : sans elle, on ne sait pas quelle coche
            correspond à quelle offre. Le prototype s'en passe, mais il montre
            les deux cartes juste au-dessus sur un écran étroit. */}
        <View style={[styles.row, styles.head]}>
          <Text style={styles.headSpacer} />
          <Text style={styles.headCell}>Gratuit</Text>
          <Text style={[styles.headCell, styles.headCellPro]}>Pro</Text>
        </View>

        {COMPARATIF.map((ligne) => (
          <View key={ligne.label} style={styles.row}>
            <Text style={styles.rowLabel}>{ligne.label}</Text>

            <View
              style={styles.cell}
              accessibilityLabel={
                ligne.gratuit ? 'Inclus dans Gratuit' : 'Non inclus dans Gratuit'
              }
            >
              <Icon
                name={ligne.gratuit ? 'check' : 'close'}
                size={18}
                color={ligne.gratuit ? 'rgba(255,255,255,0.85)' : Colors.textFaint}
              />
            </View>

            <View style={styles.cell} accessibilityLabel="Inclus dans Pro">
              <Icon name="check" size={18} color={Colors.blueMid} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Passer au Pro" onPress={() => navigation.navigate('Payment')} />
        <Button
          label="Rester en Gratuit"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
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
    marginBottom: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },

  cards: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  card: {
    flex: 1,
    gap: 5,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cardPro: { borderColor: Colors.blue, backgroundColor: 'rgba(9,92,255,0.16)' },
  cardLabel: { fontSize: 10, letterSpacing: 1.8, color: Colors.textLabel },
  cardLabelPro: { color: Colors.blueMid },
  cardPrice: { fontSize: 21, fontWeight: '700', color: Colors.textPrimary },
  cardDetail: { fontSize: 12, lineHeight: 18, color: Colors.textLabel },
  cardDetailPro: { color: 'rgba(255,255,255,0.68)' },

  table: { marginBottom: Spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  head: { borderBottomColor: Colors.border },
  headSpacer: { flex: 1 },
  headCell: {
    width: 42,
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.textLabel,
  },
  headCellPro: { color: Colors.blueMid },
  rowLabel: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.textPrimary },
  cell: { width: 42, alignItems: 'center' },

  actions: { gap: Spacing.md },
});
