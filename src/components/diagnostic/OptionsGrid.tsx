import { StyleSheet, Text, View } from 'react-native';
import { SelectableRow } from '../ui/SelectableRow';
import { FadeIn } from '../effects/FadeIn';
import { Colors, Fonts } from '../../theme/tokens';
import type { Answer } from '../../api/diagnostic';

interface OptionsGridProps {
  options: readonly string[];
  answer: Answer;
  multi: boolean;
  /** Nombre maximum de choix pour une question à choix multiple. */
  max?: number;
  /** Change à chaque question : relance la cascade d'entrée. */
  step: number;
  onSelect: (option: string) => void;
}

/** Décalage entre deux options d'une même liste, valeur du prototype. */
const STAGGER_MS = 55;

export function OptionsGrid({ options, answer, multi, max, step, onSelect }: OptionsGridProps) {
  const selectedList = Array.isArray(answer) ? answer : [];
  const isSelected = (label: string) =>
    multi ? selectedList.includes(label) : answer === label;

  return (
    <View>
      <View style={styles.list}>
        {options.map((label, i) => (
          // `key` porte l'étape : sans elle, changer de question réutilise les
          // mêmes nœuds et la cascade ne rejoue pas.
          <FadeIn key={`${step}-${label}`} duration={420} delay={i * STAGGER_MS} offset={14}>
            <SelectableRow
              label={label}
              selected={isSelected(label)}
              shape={multi ? 'square' : 'circle'}
              onPress={() => onSelect(label)}
            />
          </FadeIn>
        ))}
      </View>

      {/* Consigne placée APRÈS la liste, comme dans le prototype : avant, elle
          se lisait comme un titre de section. */}
      <Text style={styles.counter}>
        {!multi
          ? 'Une seule réponse.'
          : max
            ? `${max === 2 ? 'Deux' : max} réponses au maximum.`
            : 'Plusieurs réponses possibles.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 9 },
  counter: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.55)',
  },
});
