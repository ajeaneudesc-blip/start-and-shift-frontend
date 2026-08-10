import client from './client';

export type TemplateState = 'PUBLIE' | 'BROUILLON';

export interface Template {
  id: number;
  name: string;
  /** Ex. « Vente · 3 formats » — catégorie et nombre de formats. */
  meta: string;
  state: TemplateState;
}

/**
 * `GET /api/templates` — catalogue des modèles.
 *
 * Un client ne reçoit que les modèles `PUBLIE` : le filtre est appliqué côté
 * serveur, l'app n'a rien à cacher elle-même. Inutile donc d'afficher un badge
 * d'état côté client, il vaudrait toujours « publié ».
 *
 * Le modèle n'a **ni image ni date** : `Template` ne contient que `name`,
 * `meta` et `state`. Le prototype affiche d'ailleurs des cadres vides marqués
 * « visuel modèle à intégrer » — les vignettes restent à produire.
 */
export async function listTemplates(): Promise<Template[]> {
  const { data } = await client.get<{ items: Template[] }>('/api/templates');
  return data.items;
}

/**
 * « Vente · 3 formats » → « Vente ».
 *
 * Les catégories sont déduites des données plutôt que codées en dur : celles du
 * prototype (Couture, Transport) ne correspondent pas à ce que contient la
 * base, et une liste figée afficherait des filtres qui ne ramènent rien.
 */
export function categoryOf(meta: string): string {
  const [head] = meta.split('·');
  return head.trim() || 'Autres';
}

/** Catégories présentes, sans doublon, dans l'ordre d'apparition. */
export function categoriesOf(templates: Template[]): string[] {
  const seen: string[] = [];
  for (const t of templates) {
    const c = categoryOf(t.meta);
    if (!seen.includes(c)) seen.push(c);
  }
  return seen;
}
