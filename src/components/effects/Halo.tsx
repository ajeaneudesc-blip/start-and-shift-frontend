import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Gradients, Motion } from '../../theme/tokens';

/**
 * Le halo bleu qui éclaire le haut des écrans, tel que le prototype le pose :
 *
 *   radial-gradient(120% 52% at 50% -14%,
 *     rgba(9,92,255,.55) 0%, rgba(9,92,255,.14) 45%, rgba(9,92,255,0) 72%)
 *
 * Passe par react-native-svg (déjà une dépendance du projet) et non par
 * expo-linear-gradient, qui ne fait que du linéaire. C'est aussi le seul choix
 * qui rend à l'identique en natif ET sur react-native-web — donc dans l'EXE.
 *
 * Les rayons sont calculés en pixels à partir de la taille mesurée, et le
 * dégradé déclaré en `userSpaceOnUse`. En unités relatives, des rayons
 * supérieurs à 100 % ne sont pas interprétés de la même façon par les deux
 * cibles et le halo se réduisait à une lueur discrète au ras du bord.
 *
 * `filter: blur()` du prototype n'a pas d'équivalent en React Native, et n'est
 * pas nécessaire : un dégradé radial est déjà continu. Le flou du CSS ne
 * servait qu'à adoucir une ellipse à bords nets.
 */
export function Halo({
  animated = true,
  style,
}: {
  /** `ssHalo` : respiration lente d'opacité et d'échelle sur 9 s. */
  animated?: boolean;
  style?: ViewStyle;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: Motion.halo / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: Motion.halo / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, breath]);

  // Valeurs exactes de ssHalo : opacité .85 → 1, échelle 1 → 1.08.
  const opacity = animated ? breath.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) : 1;
  const scale = animated ? breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) : 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.wrap, style, { opacity, transform: [{ scale }] }]}
    >
      {size.width > 0 && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            {/* Centre au-dessus du cadre (« at 50% -14% »), rayons 120 % × 52 %. */}
            <RadialGradient
              id="halo"
              gradientUnits="userSpaceOnUse"
              cx={size.width / 2}
              cy={-0.14 * size.height}
              rx={1.2 * size.width}
              ry={0.52 * size.height}
            >
              {Gradients.halo.colors.map((color, i) => (
                <Stop key={color} offset={Gradients.halo.stops[i]} stopColor={color} />
              ))}
            </RadialGradient>
          </Defs>
          {/* Le dégradé porte la forme : la surface peinte est un rectangle
              plein, pas une ellipse. */}
          <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#halo)" />

          <Defs>
            {/* Deuxième couche : le halo flouté que le prototype empile sur le
                dégradé de fond (460×320 à top:-130, rgba(9,92,255,.30),
                blur 80px). Sans lui, le bleu du haut reste deux fois trop
                pâle par rapport à la maquette.
                Un disque flouté équivaut à un dégradé radial dont le rayon
                absorbe le flou — d'où les rayons augmentés de 80. */}
            <RadialGradient
              id="halo-bloom"
              gradientUnits="userSpaceOnUse"
              cx={size.width / 2}
              cy={30}
              rx={310}
              ry={240}
            >
              <Stop offset={0} stopColor="rgba(9,92,255,0.42)" />
              <Stop offset={0.55} stopColor="rgba(9,92,255,0.16)" />
              <Stop offset={1} stopColor="rgba(9,92,255,0)" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#halo-bloom)" />
        </Svg>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
