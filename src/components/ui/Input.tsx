import { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '../../theme/tokens';

interface InputProps {
  label?: string;
  /** Texte fixe à gauche du champ : « @ » pour le pseudo, « +228 » pour le numéro. */
  prefix?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  maxLength?: number;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export function Input({
  label,
  prefix,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  maxLength,
  style,
  autoFocus,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {prefix ? (
          <>
            <Text style={styles.prefix}>{prefix}</Text>
            {/* Le prototype ne met un trait qu'après « +228 » : « @ » colle au
                pseudo, qui se lit comme un seul mot. */}
            {prefix !== '@' && <View style={styles.separator} />}
          </>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textFaint}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.92)',
    // 5 px dans le prototype (gap du <label> en colonne).
    marginBottom: 5,
  },
  field: {
    // 46 et non les 42 du prototype : celui-ci est une maquette d'écran large.
    // 42 px passe sous le minimum tactile de 48 dp et fait rater des appuis sur
    // un téléphone d'entrée de gamme — le public visé n'a pas toujours un
    // écran précis ni une main assurée. Même arbitrage que Button (52).
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 11,
  },
  fieldMultiline: {
    height: undefined,
    minHeight: 132,
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  fieldFocused: { borderColor: Colors.selectedBorder, backgroundColor: 'rgba(9,92,255,0.06)' },
  fieldError: { borderColor: Colors.danger },
  prefix: { fontSize: 15, fontFamily: Fonts.medium, color: 'rgba(255,255,255,0.6)' },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    // Compense le `gap` du conteneur : le prototype veut 11 px de part et
    // d'autre du trait, pas 11 px puis 22 px.
    marginHorizontal: -1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    // Sans cela, Android rogne les jambages des lettres (p, g, j).
    paddingVertical: Spacing.sm,
  },
  inputMultiline: { minHeight: 108, textAlignVertical: 'top' },
  error: { marginTop: Spacing.sm, fontSize: 12, lineHeight: 17, color: Colors.danger },
});
