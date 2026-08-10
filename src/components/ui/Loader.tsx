import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/tokens';

interface LoaderProps {
  size?: number;
  /** Décrit l'attente pour les lecteurs d'écran. */
  label?: string;
}

/**
 * Anneau de chargement du prototype : cercle bleu qui tourne, plus une petite
 * orbe orange en orbite plus lente.
 *
 * Le prototype le dessine en SVG avec un `stroke-dashoffset` animé. On s'en
 * passe : `react-native-svg` pèse lourd pour un seul cercle, et une bordure
 * dont un seul côté est coloré donne le même arc. Les deux animations tournent
 * sur le fil natif (`useNativeDriver`), donc elles restent fluides même quand
 * le fil JavaScript est occupé — ce qui est justement le cas pendant un appel
 * réseau sur un téléphone lent.
 */
export function Loader({ size = 136, label = 'Chargement en cours' }: LoaderProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

    const ring = loop(spin, 1400);
    const dot = loop(orbit, 2600); // 2,6 s — durée de `ssOrbit` dans le prototype
    ring.start();
    dot.start();

    return () => {
      ring.stop();
      dot.stop();
    };
  }, [spin, orbit]);

  const toDegrees = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const ringStyle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <View style={[styles.track, ringStyle]} />

      <Animated.View
        style={[
          styles.arc,
          ringStyle,
          { transform: [{ rotate: toDegrees(spin) }] },
        ]}
      />

      <Animated.View
        style={[
          styles.orbitLayer,
          ringStyle,
          { transform: [{ rotate: toDegrees(orbit) }] },
        ]}
      >
        <View style={styles.orb} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  track: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  arc: {
    position: 'absolute',
    borderWidth: 2,
    // Trois côtés transparents : il ne reste qu'un quart de cercle bleu.
    borderColor: 'transparent',
    borderTopColor: Colors.blue,
  },
  orbitLayer: { position: 'absolute', alignItems: 'center' },
  orb: {
    position: 'absolute',
    top: -2.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.orange,
  },
});
