import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import { Motion } from '../../theme/tokens';

/**
 * Animation d'entrée du prototype. Deux variantes y coexistent :
 *
 *   ssBlur — from{opacity:0;translateY(16px);blur(8px)} to{…;blur(0)}
 *   ssRise — from{opacity:0;translateY(14px)}          to{…}
 *
 * Le flou de `ssBlur` n'est pas reproductible : React Native n'a pas de
 * `filter: blur()` sur une vue quelconque, et expo-blur ne floute que ce qui
 * est *derrière* une vue, pas son contenu. On garde donc la translation et
 * l'opacité, qui portent l'essentiel du mouvement.
 *
 * `delay` sert aux cascades : le prototype décale les éléments d'un même bloc
 * de 60 ms (`ssBlur 540ms … 60ms both`).
 */
export function FadeIn({
  children,
  delay = 0,
  duration = Motion.enter,
  /** Translation de départ. 16 pour ssBlur, 14 pour ssRise. */
  offset = 16,
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  offset?: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      // cubic-bezier(.2,.8,.25,1) du prototype : départ franc, arrivée douce.
      easing: Easing.bezier(0.2, 0.8, 0.25, 1),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
