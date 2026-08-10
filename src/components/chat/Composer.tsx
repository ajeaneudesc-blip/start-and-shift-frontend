import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { useDictation } from '../../hooks/useDictation';
import { Colors, Radius, Spacing } from '../../theme/tokens';

interface ComposerProps {
  onSend: (text: string) => void;
  /** Bloque la saisie tant que la conversation n'est pas chargée. */
  disabled?: boolean;
  /**
   * Message pré-rempli, à la première ouverture seulement. Sert à la
   * bibliothèque : on prépare la demande, mais on n'envoie rien — l'utilisateur
   * relit, corrige, et décide.
   */
  initialText?: string;
}

/**
 * Zone de saisie, au clavier ou à la voix.
 *
 * `FRONTEND_SPEC` §6.6 y place aussi un trombone et un appareil photo. Les
 * pièces jointes ne sont pas là : le backend ne stocke aucun fichier, `Message`
 * n'a qu'un champ `text`. Un bouton qui ne mène nulle part se lit comme une
 * panne pour un public qui lit peu — ils viendront avec le stockage.
 */
export function Composer({ onSend, disabled = false, initialText }: ComposerProps) {
  const [text, setText] = useState(initialText ?? '');
  const dictation = useDictation();
  const listening = dictation.phase === 'listening';
  const canSend = text.trim().length > 0 && !disabled;

  // La dictée complète ce qui est déjà écrit plutôt que de l'effacer.
  const base = useRef('');
  useEffect(() => {
    // La garde sur `listening` est essentielle : sans elle, cet effet peut
    // réécrire le champ après l'envoi (au remontage du composant, ou si la
    // remise à zéro de la dictée n'a pas encore été appliquée), et le message
    // qu'on vient d'envoyer réapparaît dans la zone de saisie.
    if (!listening || !dictation.transcript) return;
    const separator = base.current && !base.current.endsWith(' ') ? ' ' : '';
    setText(base.current + separator + dictation.transcript);
  }, [dictation.transcript, listening]);

  async function toggleDictation() {
    if (listening) {
      dictation.stop();
      return;
    }
    base.current = text;
    await dictation.start();
  }

  function submit() {
    if (!canSend) return;
    if (listening) dictation.stop();
    onSend(text);
    setText('');
    base.current = '';
    dictation.reset();
  }

  return (
    <View>
      {dictation.error ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {dictation.error}
        </Text>
      ) : listening ? (
        <Text style={[styles.notice, styles.listening]} accessibilityLiveRegion="polite">
          Je vous écoute… touchez le micro pour arrêter.
        </Text>
      ) : null}

      <View style={styles.bar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={listening ? 'Parlez…' : 'Écrivez ou parlez'}
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
          onPress={toggleDictation}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Arrêter de parler' : 'Parler au lieu d’écrire'}
          style={({ pressed }) => [
            styles.round,
            listening ? styles.micActive : styles.micIdle,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="mic" size={18} color={Colors.textPrimary} />
        </Pressable>

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
        <Icon
          name="send"
          size={18}
          color={canSend ? Colors.textPrimary : Colors.textFaint}
        />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.orange,
  },
  listening: { color: Colors.blueMid },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIdle: { backgroundColor: 'rgba(255,255,255,0.06)' },
  micActive: { backgroundColor: Colors.orange },
  pressed: { opacity: 0.85 },
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
