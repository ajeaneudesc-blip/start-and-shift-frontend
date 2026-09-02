import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientColors, GradientStops, Gradients, Radius } from '../../theme/tokens';

/**
 * Le « liseré lumineux » du prototype — présent sur 23 éléments là-bas, sur
 * aucun ici jusqu'à présent.
 *
 * En CSS, l'effet tient en une déclaration :
 *
 *   border: 1px solid transparent;
 *   background: linear-gradient(<fond>) padding-box,
 *               linear-gradient(140deg,…) border-box;
 *
 * React Native ne connaît ni `border-box` ni les fonds multiples. On le
 * reconstitue en deux couches : un dégradé de bordure occupant tout le cadre,
 * et par-dessus un dégradé de fond décalé d'un pixel sur les quatre côtés. Le
 * pixel qui dépasse est le liseré.
 *
 * L'animation `ssEdge` (la lumière qui parcourt le bord en 9 s) n'est pas
 * reproduite : elle anime `background-position` sur un fond de 260 %, ce que
 * ni Animated ni expo-linear-gradient ne savent faire sans redessiner le
 * dégradé à chaque image — trop coûteux sur les téléphones d'entrée de gamme
 * visés. Le dégradé fixe conserve l'essentiel de l'effet, qui est le reflet
 * orienté, pas son déplacement.
 */
export function GlowBorder({
  children,
  radius = Radius.lg,
  fill = Gradients.card,
  fillStops = Gradients.cardStops,
  edge = Gradients.edge,
  edgeStops = Gradients.edgeStops,
  style,
  contentStyle,
}: {
  children?: ReactNode;
  radius?: number;
  /** Dégradé de fond. Répéter la même couleur deux fois donne un aplat. */
  fill?: GradientColors;
  fillStops?: GradientStops;
  /** Dégradé du liseré. */
  edge?: GradientColors;
  edgeStops?: GradientStops;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}) {
  return (
    <View style={[{ borderRadius: radius }, styles.clip, style]}>
      {/* Couche du liseré : occupe tout le cadre, seul son bord reste visible. */}
      <LinearGradient
        colors={edge}
        locations={edgeStops}
        // 140deg en CSS ≈ un axe qui descend vers la droite. Les repères de
        // expo-linear-gradient sont en fractions du cadre, pas en degrés.
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Couche du fond, rentrée d'un pixel : le liseré est ce qui dépasse. */}
      <LinearGradient
        colors={fill}
        locations={fill.length === fillStops.length ? fillStops : undefined}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.fill, { borderRadius: radius - 1 }]}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Indispensable : sans découpe, les deux dégradés débordent des coins
  // arrondis et l'élément apparaît carré.
  clip: { overflow: 'hidden' },
  fill: { position: 'absolute', top: 1, left: 1, right: 1, bottom: 1 },
  content: { position: 'relative' },
});
