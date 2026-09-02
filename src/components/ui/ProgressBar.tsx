import { StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/tokens';

interface ProgressBarProps {
  /** Nombre de segments — 8 pour le diagnostic. */
  total: number;
  /** Index de l'étape en cours (0-based). */
  current: number;
  /** Nombre de segments déjà remplis, si différent de `current`. */
  completed?: number;
}

/**
 * Barre segmentée du prototype : 8 traits de 3 px, espacés de 4.
 *
 * Le code de couleur n'est pas celui qu'on attend spontanément — c'est
 * l'étape *en cours* qui est bleue, les étapes franchies sont blanches. Une
 * version précédente avait l'inverse (franchies en bleu, courante en bleu
 * clair), ce qui noyait le repère : on ne voyait plus où on en était.
 */
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
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  segment: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  segmentDone: { backgroundColor: 'rgba(255,255,255,0.78)' },
  // scaleY(1.6) du prototype : le trait courant est légèrement plus épais que
  // les autres, ce qui le repère sans changer la hauteur de la rangée.
  segmentCurrent: { backgroundColor: Colors.blue, transform: [{ scaleY: 1.6 }] },
});
