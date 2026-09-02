import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { Colors, Radius, Spacing } from '../../theme/tokens';

interface ComposerProps {
  onSend: (text: string) => void;
  /** Bloque la saisie tant que la conversation n'est pas chargée. */
  disabled?: boolean;
  /** Message pré-rempli à la première ouverture. L'utilisateur relit et décide. */
  initialText?: string;
}

/**
 * Zone de saisie du chat.
 *
 * `FRONTEND_SPEC` §6.6 y place aussi un trombone et un appareil photo. Les
 * pièces jointes ne sont pas là : le backend ne stocke aucun fichier, `Message`
 * n'a qu'un champ `text`. Un bouton qui ne mène nulle part se lit comme une
 * panne pour un public qui lit peu — ils viendront avec le stockage.
 *
 * La dictée a été retirée : la reconnaissance vocale échouait dès que le
 * réseau flanchait, ce qui est la règle plutôt que l'exception sur la cible.
 */
export function Composer({ onSend, disabled = false, initialText }: ComposerProps) {
  const [text, setText] = useState(initialText ?? '');
  const canSend = text.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText('');
  }

  return (
    <View style={styles.bar}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Écrivez votre message"
        placeholderTextColor={Colors.textFaint}
        editable={!disabled}
        multiline
        // `submit` sur entrée, comme une messagerie : la touche retour du
        // clavier mobile envoie plutôt que d'ajouter une ligne.
        blurOnSubmit={false}
        onSubmitEditing={submit}
        accessibilityLabel="Votre message"
        style={styles.input}
      />

      <Pressable
        onPress={submit}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Envoyer le message"
        aria-disabled={!canSend}
        style={({ pressed }) => [
          styles.send,
          canSend ? styles.sendActive : styles.sendIdle,
          pressed && canSend && styles.sendPressed,
        ]}
      >
        <Icon name="send" size={18} color={canSend ? Colors.textPrimary : Colors.textFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: { backgroundColor: Colors.blue },
  sendIdle: { backgroundColor: 'rgba(255,255,255,0.06)' },
  sendPressed: { opacity: 0.85 },
});
