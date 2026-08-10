/**
 * Jetons de design — repris de FRONTEND_SPEC.md §3 et du prototype v3.
 * Le fond est #0B0B0D, jamais du noir pur : le noir pur fait baver les bords
 * sur les dalles AMOLED bas de gamme.
 */

export const Colors = {
  blue: '#095CFF',
  blueMid: '#7FA9FF',
  orange: '#FF915E',
  dark: '#292929',
  bg: '#0B0B0D',
  surface: '#191A1E',
  surfaceAlt: '#121215',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.20)',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.62)',
  textFaint: 'rgba(255,255,255,0.45)',
  textLabel: 'rgba(255,255,255,0.58)',

  // États sélectionnés — valeurs exactes du prototype (lignes 1137-1158).
  selectedBg: 'rgba(9,92,255,0.14)',
  selectedBorder: 'rgba(9,92,255,0.60)',
  consentBg: 'rgba(9,92,255,0.10)',
  consentBorder: 'rgba(9,92,255,0.50)',
  idleBg: 'rgba(255,255,255,0.03)',
  idleBorder: 'rgba(255,255,255,0.12)',
  checkboxIdle: 'rgba(255,255,255,0.30)',

  // Carte « positionnement » : le prototype y met un dégradé #17213B → #0F1626.
  // React Native ne sait pas faire de dégradé sans dépendance supplémentaire,
  // on garde donc la teinte haute, qui porte l'essentiel de l'effet.
  posCardBg: '#17213B',
  posCardBorder: 'rgba(9,92,255,0.26)',

  // Carte « ce qui vous différencie », en orange.
  accentBg: 'rgba(255,145,94,0.08)',
  accentBorder: 'rgba(255,145,94,0.28)',

  chipBg: 'rgba(255,255,255,0.08)',
  numberBg: 'rgba(9,92,255,0.24)',

  danger: '#FF6B6B',
  success: '#4ADE80',
} as const;

/**
 * La police de marque « Start Shift Sans » n'est pas encore fournie et la
 * licence Hanken Grotesk reste introuvable, donc `family` vaut `undefined` :
 * React Native retombe alors sur la police système. Ne pas mettre un nom de
 * police ici tant que le fichier n'est pas chargé par expo-font — Android
 * afficherait un rendu incohérent d'un appareil à l'autre.
 */
export const Fonts = {
  family: undefined as string | undefined,
  weights: { regular: '400', medium: '500', bold: '700' },
} as const;

export const Radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 99,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Échelle typographique — pensée pour rester lisible à bout de bras. */
export const Type = {
  section: { fontSize: 11, letterSpacing: 1.4, fontWeight: '500' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '500' },
  titleSm: { fontSize: 19, lineHeight: 25, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  hint: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
} as const;
