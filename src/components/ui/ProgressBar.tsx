import { StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '../../theme/tokens';

interface ProgressBarProps {
  /** Nombre de segments — 8 pour le diagnostic. */
  total: number;
  /** Index de l'étape en cours (0-based). */
  current: number;
  /** Nombre de segments déjà remplis, si différent de `current`. */
  completed?: number;
}

/** Barre segmentée du prototype (lignes 198-202) : 8 traits de 3 px. */
export function ProgressBar({ total, current, completed }: ProgressBarProps) {
  const filled = completed ?? current;

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: filled }}
      accessibilityLabel={`Question ${current + 1} sur ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            i < filled && styles.segmentDone,
            i === current && styles.segmentCurrent,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.xs },
  segment: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  segmentDone: { backgroundColor: Colors.blue },
  segmentCurrent: { backgroundColor: Colors.blueMid },
});
