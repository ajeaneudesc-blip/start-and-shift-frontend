import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme/tokens';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Variante mise en avant : bordure bleutée, comme les cartes cochées. */
  highlighted?: boolean;
}

/**
 * Le prototype obtient ses bordures « verre » avec un `border-image` en
 * dégradé, que React Native ne sait pas reproduire. On approche l'effet avec
 * une bordure unie et un fond très légèrement éclairci — rendu proche, et
 * aucun coût de composition sur les GPU d'entrée de gamme.
 */
export function Card({ children, style, highlighted = false }: CardProps) {
  return (
    <View style={[styles.card, highlighted && styles.highlighted, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  highlighted: {
    borderColor: Colors.consentBorder,
    backgroundColor: Colors.consentBg,
  },
});
