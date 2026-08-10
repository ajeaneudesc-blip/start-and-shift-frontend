import { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing } from '../../theme/tokens';

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
            <View style={styles.separator} />
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
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: Spacing.xs + 2,
  },
  field: {
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  fieldMultiline: { minHeight: 132, alignItems: 'flex-start', paddingVertical: Spacing.md },
  fieldFocused: { borderColor: Colors.selectedBorder, backgroundColor: 'rgba(9,92,255,0.06)' },
  fieldError: { borderColor: Colors.danger },
  prefix: { fontSize: 16, fontWeight: '500', color: Colors.textMuted },
  separator: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.18)', marginLeft: -4 },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    // Sans cela, Android rogne les jambages des lettres (p, g, j).
    paddingVertical: Spacing.sm,
  },
  inputMultiline: { minHeight: 108, textAlignVertical: 'top' },
  error: { marginTop: Spacing.xs + 2, fontSize: 13, lineHeight: 18, color: Colors.danger },
});
