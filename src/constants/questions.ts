/**
 * Les 8 questions du diagnostic.
 *
 * ⚠️ NE PAS REFORMULER LES LIBELLÉS D'OPTIONS.
 * Le backend (`start-and-shift-api/src/services/strategy.ts`) compare ces
 * chaînes au caractère près : `LIEU_TXT[lieu]`, `TON_MAP[x]`, `OBJ_MAP[objectif]`,
 * `tarif === "Sur devis / prix variable"`, `canaux.indexOf("Bouche-à-oreille")`.
 * Une virgule ou un accent qui change, et la stratégie retombe silencieusement
 * sur ses valeurs par défaut — sans erreur visible.
 *
 * Source de vérité : prototype v3, lignes 767-791.
 */

export type QuestionType = 'one' | 'free' | 'multi';

export interface Question {
  /** Section affichée en tête d'écran. */
  sec: string;
  type: QuestionType;
  /** Intitulé de la question. */
  t: string;
  /** Précision sous l'intitulé. */
  h: string;
  /** Options pour `one` et `multi`. */
  opts?: readonly string[];
  /** Texte d'exemple pour `free`. */
  ph?: string;
  /** Nombre maximum de choix pour `multi`. */
  max?: number;
  /** Transcription simulée du mode vocal — utilisée à l'étape 8. */
  tr: string;
}

export const QUESTIONS: readonly Question[] = [
  {
    sec: 'VOTRE ACTIVITÉ',
    type: 'one',
    t: "Qu'est-ce que vous faites ?",
    h: 'Choisissez ce qui vous ressemble le mieux.',
    opts: [
      'Commerce (je vends des produits)',
      'Prestation (je vends du savoir-faire)',
      'Création (artisan·e, artiste, designer…)',
      'Organisation (association, ONG…)',
      'Je lance mon activité',
    ],
    tr: 'Commerce (je vends des produits)',
  },
  {
    sec: 'VOTRE ACTIVITÉ',
    type: 'one',
    t: 'Où exercez-vous ?',
    h: 'Choisissez votre mode principal.',
    opts: [
      'En boutique / point fixe',
      'Au marché',
      'À domicile / en déplacement',
      'Sur WhatsApp / en ligne',
      'Les deux (physique + en ligne)',
    ],
    tr: 'En boutique / point fixe',
  },
  {
    sec: 'VOS PUBLICS',
    type: 'free',
    t: 'Décrivez vos publics principaux.',
    h: 'Qui bénéficie de votre travail ? Âge, situation, occasion.',
    ph: 'Ex. des femmes de 25 à 40 ans, des entreprises du quartier, des associations…',
    tr: 'Des femmes du quartier pour les cérémonies, et des familles pour les fêtes.',
  },
  {
    sec: 'VOS PUBLICS',
    type: 'multi',
    t: 'Comment vos publics vous trouvent-ils ?',
    h: 'Plusieurs réponses possibles.',
    opts: [
      'Bouche-à-oreille',
      'Ils passent devant',
      'WhatsApp',
      'Facebook / TikTok',
      'Réseau / recommandations',
    ],
    tr: 'Bouche-à-oreille',
  },
  {
    sec: 'VOTRE FORCE',
    type: 'free',
    t: 'Pourquoi vos publics ont-ils besoin de vous ?',
    h: "Le problème qu'ils ont — et ce que vous faites mieux que les autres pour le résoudre.",
    ph: "Ex. ils cherchent quelqu'un de disponible et de confiance, pas facile à trouver ; moi je réponds vite et je livre le jour même…",
    tr: 'Ils veulent fiabilité et disponibilité — je livre le jour même et je conseille chaque commande.',
  },
  {
    sec: 'VOTRE FORCE',
    type: 'one',
    t: 'Comment vous facturez ?',
    h: 'Cela oriente le style de vos visuels.',
    opts: [
      'Moins de 2 000 F',
      '2 000 à 10 000 F',
      '10 000 à 50 000 F',
      'Plus de 50 000 F',
      'Sur devis / prix variable',
      'Gratuit / don / adhésion',
    ],
    tr: '2 000 à 10 000 F',
  },
  {
    sec: 'VOTRE AMBITION',
    type: 'one',
    t: 'Votre priorité dans 3 mois ?',
    h: 'Une seule, la plus urgente.',
    opts: [
      'Toucher plus de monde',
      'Valoriser mon offre (être mieux payé·e)',
      'Me développer (nouveau lieu, nouvelle offre)',
      'Asseoir ma notoriété',
    ],
    tr: 'Toucher plus de monde',
  },
  {
    sec: 'VOTRE AMBITION',
    type: 'multi',
    t: 'Quelle image voulez-vous projeter ?',
    h: 'Choisissez au maximum deux mots.',
    opts: ['Sérieuse', 'Proche', 'Moderne', 'Traditionnelle', 'Haut de gamme'],
    max: 2,
    tr: 'Sérieuse',
  },
] as const;

export const ANSWER_COUNT = QUESTIONS.length; // 8, comme le backend
