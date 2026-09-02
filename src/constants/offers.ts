/**
 * Tarifs et contenus des offres — repris du prototype v3 (lignes 1258-1272,
 * 516-517, 576-584).
 *
 * Aucune de ces valeurs ne vient du backend : il n'expose ni catalogue ni
 * grille tarifaire. Elles sont donc figées ici, et toute modification de prix
 * demande une nouvelle version de l'app. À déplacer côté serveur si les tarifs
 * doivent bouger sans publier.
 */

export const PACK_IDENTITE = {
  nom: 'Pack identité',
  detail: '3 visuels, livrés sous 48 h.',
  montantFCFA: 18000,
};




/**
 * Moyens de paiement acceptés. Les trois sont **manuels** : aucun n'est un
 * paiement intégré à l'app.
 */
export const MOYENS_PAIEMENT: readonly {
  nom: string;
  detail: string;
  icone: 'card' | 'store';
}[] = [
  { nom: 'T-Money', detail: 'Togocom', icone: 'card' },
  { nom: 'Flooz', detail: 'Moov Africa', icone: 'card' },
  { nom: 'Espèces au bureau', detail: 'Lomé, Bè-Kpota', icone: 'store' },
] as const;

/** « 18 000 F » — espace simple, comme `formatFCFA()` du backend. */
export function formatFCFA(montant: number): string {
  return montant.toLocaleString('fr-FR').replace(/[   ]/g, ' ') + ' F';
}
