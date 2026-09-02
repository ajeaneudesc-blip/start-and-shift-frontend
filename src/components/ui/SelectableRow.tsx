import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../../theme/tokens';
import { Icon } from './Icon';

interface SelectableRowProps {
  label: string;
  /** Mention secondaire en petites capitales : OBLIGATOIRE, RECOMMANDÉ… */
  hint?: string;
  selected: boolean;
  onPress: () => void;
  /**
   * `circle` pour un choix unique, `square` pour un choix multiple — la forme
   * indique si l'on peut cocher plusieurs cases, sans avoir à lire la consigne.
   */
  shape?: 'circle' | 'square';
  disabled?: boolean;
}

export function SelectableRow({
  label,
  hint,
  selected,
  onPress,
  shape = 'circle',
  disabled = false,
}: SelectableRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={shape === 'circle' ? 'radio' : 'checkbox'}
      // `accessibilityState` ne descend PAS jusqu'à l'ARIA avec react-native-web :
      // vérifié dans le navigateur, l'élément ne portait que `role` et
      // `aria-label`, donc un lecteur d'écran annonçait « case à cocher » sans
      // jamais dire si elle était cochée. `aria-checked` fonctionne des deux
      // côtés — React Native le retraduit en accessibilityState sur mobile.
      aria-checked={selected}
      aria-disabled={disabled}
      accessibilityLabel={hint ? `${label.replace(/\.$/, '')}. ${hint}` : label}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : styles.rowIdle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.box,
          shape === 'circle' ? styles.boxCircle : styles.boxSquare,
          selected ? styles.boxSelected : styles.boxIdle,
        ]}
      >
        {selected ? <Icon name="check" size={15} /> : null}
      </View>

      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    // Le prototype centre la pastille sur la ligne. En `flex-start` elle
    // flottait au-dessus du texte dès qu'une option tenait sur deux lignes.
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  rowIdle: { borderColor: Colors.idleBorder, backgroundColor: Colors.idleBg },
  rowSelected: { borderColor: Colors.selectedBorder, backgroundColor: Colors.selectedBg },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  box: {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCircle: { borderRadius: 12 },
  boxSquare: { borderRadius: 8 },
  boxIdle: { borderColor: Colors.checkboxIdle, backgroundColor: 'transparent' },
  boxSelected: { borderColor: Colors.blue, backgroundColor: Colors.blue },
  textCol: { flex: 1, gap: 3 },
  label: { fontSize: 15, lineHeight: 22, fontFamily: Fonts.medium, color: Colors.textPrimary },
  hint: { fontSize: 10, letterSpacing: 1.6, fontFamily: Fonts.medium, color: Colors.textLabel },
});
