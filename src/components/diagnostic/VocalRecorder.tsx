import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { useDictation } from '../../hooks/useDictation';
import { Colors, Radius, Spacing } from '../../theme/tokens';

/** Décalages du prototype, pour que les barres ne pulsent pas en cœur. */
const BAR_DELAYS = [0, 120, 240, 60, 300, 180, 400];

interface VocalRecorderProps {
  /** Texte actuel du champ — la dictée s'y ajoute au lieu de l'effacer. */
  value: string;
  onChange: (text: string) => void;
}

/**
 * Dictée : l'utilisateur parle, le texte s'écrit.
 *
 * Le texte reconnu vient compléter ce qui est déjà là. Une personne peut donc
 * parler, s'arrêter, reprendre — ou taper un mot puis dicter la suite — sans
 * jamais perdre ce qu'elle a déjà donné.
 */
export function VocalRecorder({ value, onChange }: VocalRecorderProps) {
  const dictation = useDictation();
  const listening = dictation.phase === 'listening';

  // Ce qu'il y avait avant de prendre la parole. Figé au démarrage, sinon
  // chaque mise à jour du texte reconnu se cumulerait avec la précédente.
  const base = useRef('');

  useEffect(() => {
    // La garde sur `listening` évite que l'effet réécrive la réponse une fois
    // le micro coupé — au remontage du composant, ou avant que la remise à
    // zéro de la dictée ait été appliquée.
    if (!listening || !dictation.transcript) return;
    const separator = base.current && !base.current.endsWith(' ') ? ' ' : '';
    onChange(base.current + separator + dictation.transcript);
    // `onChange` change d'identité à chaque rendu du parent : l'exclure évite
    // une boucle de mises à jour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictation.transcript, listening]);

  async function toggle() {
    if (listening) {
      dictation.stop();
      return;
    }
    base.current = value;
    await dictation.start();
  }

  if (dictation.phase === 'denied') {
    return (
      <View style={styles.box}>
        <Text style={styles.denied}>
          Le micro est refusé. Autorisez-le dans les réglages du téléphone, ou écrivez votre
          réponse.
        </Text>
        <Pressable onPress={dictation.reset} accessibilityRole="button" style={styles.link}>
          <Text style={styles.linkLabel}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={listening ? "Arrêter de parler" : 'Parler au lieu d’écrire'}
          style={({ pressed }) => [
            styles.mic,
            listening ? styles.micActive : styles.micIdle,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="mic" size={22} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.middle}>
          <Text style={styles.state}>
            {listening ? 'Je vous écoute…' : 'Appuyez et parlez'}
          </Text>
          <Waveform active={listening} />
        </View>
      </View>

      {dictation.error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {dictation.error}
        </Text>
      ) : null}
    </View>
  );
}

function Waveform({ active }: { active: boolean }) {
  const values = useRef(BAR_DELAYS.map(() => new Animated.Value(0.2))).current;

  useEffect(() => {
    if (!active) {
      values.forEach((v) => v.setValue(0.2));
      return;
    }

    const loops = values.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(BAR_DELAYS[i]),
          Animated.timing(value, {
            toValue: 1,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, values]);

  return (
    <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no">
      {values.map((value, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: active ? Colors.blueMid : 'rgba(255,255,255,0.18)',
              transform: [{ scaleY: value }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.idleBg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  mic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIdle: { backgroundColor: Colors.blue },
  micActive: { backgroundColor: Colors.orange },
  pressed: { opacity: 0.85 },
  middle: { flex: 1, gap: Spacing.sm },
  state: { fontSize: 14, color: Colors.textMuted },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 24 },
  bar: { flex: 1, maxWidth: 5, height: 24, borderRadius: 3 },
  denied: { fontSize: 14, lineHeight: 21, color: Colors.orange },
  link: { alignSelf: 'flex-start', paddingVertical: Spacing.xs },
  linkLabel: { fontSize: 14, color: Colors.blueMid },
  error: { fontSize: 13, lineHeight: 19, color: Colors.orange },
});
