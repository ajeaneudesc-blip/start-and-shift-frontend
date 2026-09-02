import { StyleSheet, Text, ViewStyle } from 'react-native';
import { FadeIn } from '../effects/FadeIn';
import { Colors, Fonts, Motion } from '../../theme/tokens';

interface QuestionCardProps {
  title: string;
  hint: string;
  /** Change à chaque question : relance l'animation d'entrée. */
  step: number;
  style?: ViewStyle;
}

/**
 * Intitulé d'une question et sa précision.
 *
 * La section n'y figure plus : le prototype ne l'affiche qu'une fois, dans
 * l'en-tête (« VOTRE ACTIVITÉ · 1 / 8 »). La répéter au-dessus du titre la
 * faisait lire deux fois à trois lignes d'intervalle.
 *
 * `key={step}` sur les FadeIn : sans lui, React réutilise les mêmes nœuds
 * d'une question à l'autre et l'animation ne rejoue pas.
 */
export function QuestionCard({ title, hint, step, style }: QuestionCardProps) {
  return (
    <FadeIn key={step} duration={460} offset={0} style={style}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {/* 70 ms après le titre, comme le prototype décale les deux ssSlide. */}
      <FadeIn key={`hint-${step}`} duration={460} delay={Motion.stagger + 10} offset={0}>
        <Text style={styles.hint}>{hint}</Text>
      </FadeIn>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  hint: {
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.6)',
  },
});
