import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme/tokens';

export type StrategyCardVariant = 'default' | 'positioning' | 'accent';

interface StrategyCardProps {
  /** Intitulé en petites capitales : POSITIONNEMENT, TON ET COULEURS… */
  label: string;
  variant?: StrategyCardVariant;
  children: ReactNode;
  style?: ViewStyle;
}

/** Carte d'une section de la stratégie (prototype, lignes 317-352). */
export function StrategyCard({
  label,
  variant = 'default',
  children,
  style,
}: StrategyCardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'positioning' && styles.positioning,
        variant === 'accent' && styles.accent,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'positioning' && styles.labelPositioning,
          variant === 'accent' && styles.labelAccent,
        ]}
        accessibilityRole="header"
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg + 2,
    gap: Spacing.md,
  },
  positioning: {
    backgroundColor: Colors.posCardBg,
    borderColor: Colors.posCardBorder,
  },
  accent: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.accentBorder,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: Colors.textLabel,
  },
  labelPositioning: { color: Colors.blueMid },
  labelAccent: { color: Colors.orange },
});
