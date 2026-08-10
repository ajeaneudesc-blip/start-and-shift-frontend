import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { useSpeech } from '../../hooks/useSpeech';
import { Colors, Radius, Spacing } from '../../theme/tokens';

interface SpeakButtonProps {
  /** Texte lu à voix haute. */
  text: string;
  /** Libellé affiché à côté de l'icône. */
  label?: string;
  compact?: boolean;
}

/** Bouton « Écouter » — lit un texte avec la voix du téléphone. */
export function SpeakButton({ text, label = 'Écouter', compact = false }: SpeakButtonProps) {
  const { speaking, toggle } = useSpeech();

  return (
    <Pressable
      onPress={() => toggle(text)}
      accessibilityRole="button"
      accessibilityLabel={speaking ? 'Arrêter la lecture' : `${label} : ${text}`}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        speaking && styles.speaking,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        name="sound"
        size={compact ? 16 : 18}
        color={speaking ? Colors.blueMid : Colors.textMuted}
      />
      <Text style={[styles.label, speaking && styles.labelSpeaking]}>
        {speaking ? 'Arrêter' : label}
      </Text>
      {!compact ? (
        <View style={styles.dot}>
          <Icon name="arrow-right" size={13} color={Colors.textFaint} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
    borderRadius: Radius.md,
  },
  compact: { minHeight: 38, gap: Spacing.sm },
  speaking: { backgroundColor: 'rgba(9,92,255,0.10)' },
  pressed: { opacity: 0.7 },
  label: { flex: 1, fontSize: 14, color: Colors.textMuted },
  labelSpeaking: { color: Colors.blueMid },
  dot: { opacity: 0.7 },
});
