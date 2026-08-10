import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  /** Lu par les lecteurs d'écran à la place du libellé quand il est ambigu. */
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      // Voir SelectableRow : `accessibilityState` est ignoré côté web, les
      // attributs ARIA explicites sont les seuls à arriver jusqu'au DOM.
      aria-disabled={inactive}
      aria-busy={loading}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textPrimary : Colors.blueMid} />
      ) : (
        <View style={styles.content}>
          <Text
            numberOfLines={2}
            style={[
              styles.label,
              variant === 'ghost' && styles.labelGhost,
              inactive && styles.labelInactive,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // 52 au lieu des 42 du prototype : celui-ci est une maquette d'écran large.
    // Sur un téléphone d'entrée de gamme, 42 px passe sous le minimum tactile
    // recommandé (48 dp) et fait rater des appuis — le public visé n'a pas
    // toujours un écran précis ni une main assurée.
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  primary: { backgroundColor: Colors.blue },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  inactive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  labelGhost: { color: Colors.textMuted, fontWeight: '400' },
  labelInactive: { color: Colors.textFaint },
});
