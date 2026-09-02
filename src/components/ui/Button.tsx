import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import { Colors, Fonts, Gradients, Radius, Spacing } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Flèche à droite du libellé, comme sur les boutons d'avancement du prototype. */
  arrow?: boolean;
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
  arrow = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const showGlow = variant === 'primary' && !inactive;

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
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'primary' && !showGlow && styles.primaryFlat,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {/* Liseré lumineux du prototype : aplat #095CFF en padding-box, dégradé
          blanc en border-box. Deux couches, faute de border-box en RN. */}
      {showGlow && (
        <>
          <LinearGradient
            colors={Gradients.edgeButton}
            locations={Gradients.edgeButtonStops}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: Radius.md }]}
          />
          <View style={styles.primaryFill} />
        </>
      )}

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
          {arrow && !inactive && (
            <Icon
              name="arrow-right"
              size={18}
              color={variant === 'primary' ? Colors.textPrimary : Colors.blueMid}
            />
          )}
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
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    // Sans découpe, les dégradés débordent des coins arrondis.
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.smd },
  // Fond du bouton primaire, rentré d'un pixel : le liseré est ce qui dépasse.
  primaryFill: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: Radius.md - 1,
    backgroundColor: Colors.blue,
  },
  // Repli sans liseré (bouton primaire désactivé) : l'aplat suffit.
  primaryFlat: { backgroundColor: Colors.blue },
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
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  labelGhost: { color: Colors.textMuted, fontFamily: Fonts.regular },
  labelInactive: { color: Colors.textFaint },
});
