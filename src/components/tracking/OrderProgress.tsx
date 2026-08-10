import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { Order, ORDER_LABELS, ORDER_STEPS } from '../../api/orders';
import { formatDate } from '../../utils/time';
import { Colors, Radius, Spacing } from '../../theme/tokens';

/** Ce que chaque étape veut dire, en clair. */
const EXPLICATIONS: Record<string, string> = {
  PAYE: "Votre paiement est enregistré. L'équipe va commencer.",
  EN_PRODUCTION: 'Vos visuels sont en cours de création.',
  LIVRE: 'Vos visuels sont prêts. Ils vous ont été envoyés dans la discussion.',
};

interface OrderProgressProps {
  order: Order;
  /** Version resserrée : sans l'explication de l'étape en cours. */
  compact?: boolean;
}

export function OrderProgress({ order, compact = false }: OrderProgressProps) {
  const courant = ORDER_STEPS.indexOf(order.state);
  const archivee = order.state === 'ARCHIVE';

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.ref}>{order.ref}</Text>
          <Text style={styles.meta}>
            {order.pack} — {order.amount}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      </View>

      <View style={styles.steps}>
        {ORDER_STEPS.map((etape, i) => {
          // Une commande archivée est passée par toutes les étapes.
          const fait = archivee || courant >= i;
          const encours = !archivee && courant === i;
          const dernier = i === ORDER_STEPS.length - 1;

          return (
            <View key={etape} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.bullet, fait ? styles.bulletDone : styles.bulletTodo]}>
                  {fait ? <Icon name="check" size={13} /> : null}
                </View>
                {!dernier ? (
                  <View style={[styles.line, fait && courant > i && styles.lineDone]} />
                ) : null}
              </View>

              <View style={styles.stepText}>
                <Text style={[styles.stepLabel, !fait && styles.stepLabelTodo]}>
                  {ORDER_LABELS[etape]}
                </Text>
                {encours && !compact ? (
                  <Text style={styles.stepHint}>{EXPLICATIONS[etape]}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {archivee ? <Text style={styles.archived}>Cette commande est archivée.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  headText: { flex: 1, gap: 3 },
  ref: { fontSize: 19, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: 13, color: Colors.textMuted },
  date: { fontSize: 12, color: Colors.textFaint },

  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: Spacing.md },
  // Le rail porte la pastille et le trait qui descend vers l'étape suivante :
  // sans ce trait, les trois étapes se lisent comme une liste, pas comme une
  // progression.
  rail: { alignItems: 'center', width: 26 },
  bullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bulletDone: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  bulletTodo: { borderColor: Colors.checkboxIdle },
  line: { width: 2, flex: 1, minHeight: 22, backgroundColor: 'rgba(255,255,255,0.12)' },
  lineDone: { backgroundColor: Colors.blue },

  stepText: { flex: 1, paddingBottom: Spacing.lg, gap: 3 },
  stepLabel: { fontSize: 15, color: Colors.textPrimary },
  stepLabelTodo: { color: Colors.textFaint },
  stepHint: { fontSize: 13, lineHeight: 19, color: Colors.textMuted },

  archived: { fontSize: 13, color: Colors.textFaint },
});
