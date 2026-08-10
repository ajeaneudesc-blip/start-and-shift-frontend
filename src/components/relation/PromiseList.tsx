import { StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../ui/Icon';
import { Colors, Spacing } from '../../theme/tokens';

interface Promise {
  icon: IconName;
  label: string;
  hint: string;
}

/** Les quatre engagements du prototype (lignes 1378-1381), dans l'ordre. */
export const PROMISES: readonly Promise[] = [
  {
    icon: 'clock',
    label: 'Une première proposition sous 48 h',
    hint: "Vous êtes prévenu dès qu'elle est prête.",
  },
  {
    icon: 'refresh',
    label: 'Deux séries de corrections incluses',
    hint: 'Vous demandez les changements dans le chat.',
  },
  {
    icon: 'sound',
    label: 'Vous pouvez répondre en vocal',
    hint: "Aucune obligation d'écrire.",
  },
  {
    icon: 'shield',
    label: 'Vos réponses restent privées',
    hint: "Rien n'est publié sans votre accord.",
  },
] as const;

export function PromiseList() {
  return (
    <View>
      {PROMISES.map((promise, i) => (
        <View
          key={promise.label}
          style={[styles.row, i === PROMISES.length - 1 && styles.rowLast]}
        >
          <Icon name={promise.icon} size={18} color={Colors.blueMid} style={styles.icon} />
          <View style={styles.text}>
            <Text style={styles.label}>{promise.label}</Text>
            <Text style={styles.hint}>{promise.hint}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.lg - 1,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  rowLast: { borderBottomWidth: 0 },
  icon: { marginTop: 2 },
  text: { flex: 1, gap: 2 },
  label: { fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  hint: { fontSize: 12, lineHeight: 18, color: Colors.textLabel },
});
