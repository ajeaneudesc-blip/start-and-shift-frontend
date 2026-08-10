import { StyleSheet, Text, View } from 'react-native';
import { SelectableRow } from '../ui/SelectableRow';
import { Colors, Spacing } from '../../theme/tokens';
import type { Answer } from '../../api/diagnostic';

interface OptionsGridProps {
  options: readonly string[];
  answer: Answer;
  multi: boolean;
  /** Nombre maximum de choix pour une question à choix multiple. */
  max?: number;
  onSelect: (option: string) => void;
}

export function OptionsGrid({ options, answer, multi, max, onSelect }: OptionsGridProps) {
  const selectedList = Array.isArray(answer) ? answer : [];
  const isSelected = (label: string) =>
    multi ? selectedList.includes(label) : answer === label;

  return (
    <View style={styles.list}>
      {multi && max ? (
        <Text style={styles.counter}>
          {selectedList.length} choisi{selectedList.length > 1 ? 's' : ''} sur {max} maximum
        </Text>
      ) : null}

      {options.map((label) => (
        <SelectableRow
          key={label}
          label={label}
          selected={isSelected(label)}
          shape={multi ? 'square' : 'circle'}
          onPress={() => onSelect(label)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  counter: {
    fontSize: 12,
    color: Colors.textFaint,
    marginBottom: Spacing.xs,
  },
});
