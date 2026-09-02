/**
 * Jetons de design — valeurs reprises telles quelles de
 * `design/design-handoff/README.md` et du prototype v3. Le handoff est la
 * source de vérité : en cas de doute, aller relire le prototype plutôt que
 * d'ajuster à l'œil.
 */

export const Colors = {
  blue: '#095CFF',
  blueHover: '#1E6BFF',
  blueMid: '#7FA9FF',
  orange: '#FF915E',
  orangeText: '#FFB894',
  dark: '#292929',

  // #0A0A0C et non du noir pur : le noir pur fait baver les bords sur les
  // dalles AMOLED bas de gamme.
  bg: '#0A0A0C',
  surface: '#191A1E',
  surfaceAlt: '#121215',
  surfaceDeep: '#0E0E11',

  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.13)',

  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.62)',
  textFaint: 'rgba(255,255,255,0.45)',
  textLabel: 'rgba(255,255,255,0.58)',

  // États sélectionnés — valeurs exactes du prototype.
  selectedBg: 'rgba(9,92,255,0.14)',
  selectedBorder: 'rgba(9,92,255,0.60)',
  idleBg: 'rgba(255,255,255,0.03)',
  idleBorder: 'rgba(255,255,255,0.12)',
  checkboxIdle: 'rgba(255,255,255,0.30)',

  posCardBorder: 'rgba(9,92,255,0.26)',
  // Teinte haute du dégradé de la carte « positionnement ». Conservée pour les
  // fonds plats ; le dégradé complet est dans `Gradients.positioning`.
  posCardBg: '#17213B',
  // Encart de consentement, désormais réduit à une mention sous le bouton.
  consentBg: 'rgba(9,92,255,0.10)',
  consentBorder: 'rgba(9,92,255,0.50)',
  accentBg: 'rgba(255,145,94,0.08)',
  accentBorder: 'rgba(255,145,94,0.28)',
  chipBg: 'rgba(255,255,255,0.08)',
  numberBg: 'rgba(9,92,255,0.24)',

  success: '#1FAA59',
  successText: '#6BD79A',
  successBg: 'rgba(31,170,89,0.16)',
  danger: '#FF8A8A',
  dangerBg: 'rgba(255,99,99,0.14)',
  dangerBorder: 'rgba(255,99,99,0.28)',
  warningText: '#FFB894',
  warningBg: 'rgba(255,145,94,0.16)',
} as const;

/**
 * Dégradés du prototype. React Native ne connaît pas `linear-gradient` : ces
 * tableaux alimentent `<LinearGradient>` (expo-linear-gradient), dont l'axe se
 * règle par `start`/`end` plutôt que par un angle en degrés.
 *
 * Le motif récurrent du prototype est
 * `linear-gradient(<remplissage>) padding-box, linear-gradient(140deg,…) border-box` :
 * un fond, plus une bordure en dégradé qui part d'un blanc franc en haut à
 * gauche et se teinte de bleu puis d'orange en bas à droite. C'est l'effet
 * « liseré lumineux » — voir components/effects/GlowBorder.tsx.
 */
/** `<LinearGradient>` exige au moins deux couleurs, d'où le type en n-uplet. */
export type GradientColors = readonly [string, string, ...string[]];
export type GradientStops = readonly [number, number, ...number[]];

export const Gradients = {
  /** Fond du cadre : `linear-gradient(172deg,#101013,#0A0A0C)`. */
  frame: ['#101013', '#0A0A0C'] as GradientColors,
  /** Fond de carte : `linear-gradient(168deg,#191A1E 0%,#121215 46%,#0E0E11 100%)`. */
  card: ['#191A1E', '#121215', '#0E0E11'] as GradientColors,
  cardStops: [0, 0.46, 1] as GradientStops,
  /** Carte « positionnement » : `linear-gradient(168deg,#17213B,#0F1626)`. */
  positioning: ['#17213B', '#0F1626'] as GradientColors,

  /** Bordure lumineuse standard, teintée bleu puis orange. */
  edge: [
    'rgba(255,255,255,0.36)',
    'rgba(255,255,255,0.075)',
    'rgba(255,255,255,0.025)',
    'rgba(9,92,255,0.16)',
    'rgba(255,145,94,0.12)',
  ] as GradientColors,
  edgeStops: [0, 0.14, 0.5, 0.86, 1] as GradientStops,

  /** Variante appuyée, pour les éléments mis en avant (panneau d'inscription). */
  edgeStrong: [
    'rgba(255,255,255,0.48)',
    'rgba(255,255,255,0.11)',
    'rgba(255,255,255,0.035)',
    'rgba(9,92,255,0.20)',
    'rgba(255,145,94,0.16)',
  ] as GradientColors,

  /** Bordure du bouton primaire, posée sur un aplat #095CFF. */
  edgeButton: [
    'rgba(255,255,255,0.66)',
    'rgba(255,255,255,0.20)',
    'rgba(255,255,255,0.07)',
    'rgba(255,255,255,0.16)',
  ] as GradientColors,
  edgeButtonStops: [0, 0.15, 0.5, 1] as GradientStops,

  /**
   * Halo bleu du haut d'écran :
   * `radial-gradient(120% 52% at 50% -14%, rgba(9,92,255,.55), rgba(9,92,255,.14) 45%, transparent 72%)`.
   * Rendu par react-native-svg (déjà installé), le seul moyen d'obtenir un
   * dégradé radial qui fonctionne à la fois en natif et sur react-native-web —
   * expo-linear-gradient ne fait que du linéaire.
   */
  halo: {
    colors: ['rgba(9,92,255,0.55)', 'rgba(9,92,255,0.14)', 'rgba(9,92,255,0)'] as const,
    stops: [0, 0.45, 0.72] as const,
  },
} as const;

/**
 * Ombres du handoff. `shadowColor` + `shadowOpacity` séparés parce que React
 * Native n'accepte pas de rgba() dans `shadowColor` sur Android.
 */
export const Shadows = {
  /** `0 40px 110px -30px rgba(0,0,0,.9)` — cadre. */
  frame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.9,
    shadowRadius: 55,
    elevation: 24,
  },
  /** `0 28px 60px -30px rgba(0,0,0,.85)` — panneau. */
  panel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.85,
    shadowRadius: 30,
    elevation: 16,
  },
} as const;

/**
 * Polices de marque, chargées par `useFonts` dans App.tsx. Les noms doivent
 * correspondre exactement aux clés déclarées là-bas.
 *
 * React Native ne dérive pas les graisses d'une famille : contrairement au
 * web, `fontWeight: '700'` sur une famille chargée en Regular ne donne rien
 * (ou pire, une fausse graisse sur Android). Chaque graisse est donc une
 * famille distincte, et c'est `family.*` qu'il faut utiliser, jamais
 * `fontWeight`.
 */
export const Fonts = {
  regular: 'StartShiftSans-Regular',
  medium: 'StartShiftSans-Medium',
  bold: 'StartShiftSans-Bold',
  serif: 'StartShiftSerif-Medium',
} as const;

export const Radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 24,
  frame: 44,
  pill: 99,
} as const;

/** Échelle du handoff : 4 / 6 / 8 / 10 / 12 / 14 / 18 / 22 / 26. */
export const Spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  smd: 10,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 26,
} as const;

/**
 * Hauteur unique des contrôles (champs, boutons, onglets) : 42 px. C'est aussi
 * la cible tactile minimale du handoff — descendre en dessous rend l'app
 * difficile à utiliser d'une main sur un téléphone d'entrée de gamme.
 */
export const CONTROL_HEIGHT = 42;

/** Durées et courbes des animations du prototype, en un seul endroit. */
export const Motion = {
  /** `ssBlur` — entrée : translateY 16px + flou 8px → 0. */
  enter: 440,
  /** Variante longue de `ssBlur`, sur les blocs principaux. */
  enterSlow: 540,
  /** `ssRise` — entrée sobre : translateY 14px. */
  rise: 620,
  /** `ssPop` — apparition avec léger dépassement. */
  pop: 480,
  /** `ssEdge` — parcours de la lumière sur le bord. */
  edge: 9000,
  /** `ssHalo` — respiration des halos. */
  halo: 9000,
  /** Transitions de couleur. */
  color: 160,
  /** Déplacements (indicateur d'onglet). */
  move: 380,
  /** Décalage entre deux éléments d'une même cascade d'entrée. */
  stagger: 60,
} as const;

/**
 * Échelle typographique du handoff. `fontFamily` porte la graisse (voir
 * `Fonts`), d'où l'absence de `fontWeight`.
 */
export const Type = {
  /** Sur-titre : 10 px, interlettrage .2em, majuscules. */
  overline: { fontSize: 10, letterSpacing: 2, fontFamily: Fonts.medium },
  section: { fontSize: 11, letterSpacing: 1.4, fontFamily: Fonts.medium },
  /** Titre d'écran : 20/25, interlettrage -.02em. */
  title: { fontSize: 20, lineHeight: 25, letterSpacing: -0.4, fontFamily: Fonts.bold },
  titleSm: { fontSize: 19, lineHeight: 25, letterSpacing: -0.38, fontFamily: Fonts.bold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: Fonts.regular },
  label: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.medium },
  hint: { fontSize: 11, lineHeight: 16, fontFamily: Fonts.regular },
} as const;
