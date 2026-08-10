import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';

interface QuestionCardProps {
  section: string;
  title: string;
  hint: string;
  style?: ViewStyle;
}

/** En-tête d'une question : section, intitulé, précision. */
export function QuestionCard({ section, title, hint, style }: QuestionCardProps) {
  return (
    <View style={style}>
      <Text style={styles.section}>{section}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '500',
    color: Colors.blueMid,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hint: {
    marginTop: Spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textMuted,
  },
});
