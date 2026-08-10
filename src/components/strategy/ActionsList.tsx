import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';

interface ActionsListProps {
  actions: string[];
}

/** Liste numérotée des trois actions (prototype, lignes 342-347). */
export function ActionsList({ actions }: ActionsListProps) {
  return (
    <View style={styles.list}>
      {actions.map((action, i) => (
        <View key={`${i}-${action}`} style={styles.row}>
          {/* Le numéro est décoratif : il est déjà annoncé dans le texte lu. */}
          <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no">
            <Text style={styles.badgeLabel}>{i + 1}</Text>
          </View>
          <Text style={styles.text} accessibilityLabel={`Action ${i + 1} : ${action}`}>
            {action}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  badge: {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: 8,
    backgroundColor: Colors.numberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: { fontSize: 12, fontWeight: '500', color: Colors.blueMid },
  text: { flex: 1, fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.92)' },
});
