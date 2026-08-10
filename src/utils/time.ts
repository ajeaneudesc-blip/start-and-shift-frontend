const pad = (n: number) => String(n).padStart(2, '0');

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Aujourd'hui → « 14:05 », hier → « Hier », au-delà → « 07/08 ».
 *
 * Reprise à l'identique de `formatTime()` du backend (`services/format.ts`).
 * Le serveur formate déjà l'heure sur certaines routes, mais pas sur les
 * messages poussés par WebSocket : formater ici évite qu'un même message
 * s'affiche différemment selon qu'il arrive en direct ou après rechargement.
 */
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 10 août 2026 » — date longue, plus lisible qu'un 10/08/2026. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  if (sameDay(d, now)) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Hier';

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
