import client from './client';

/** Étapes d'une commande, dans l'ordre. Le serveur n'autorise qu'un pas en avant. */
export type OrderState = 'PAYE' | 'EN_PRODUCTION' | 'LIVRE' | 'ARCHIVE';

export interface Order {
  /** Référence lisible, ex. « CMD-4821 ». */
  ref: string;
  client: string;
  handle: string;
  pack: string;
  amountFCFA: number;
  /** Montant déjà mis en forme par le serveur, ex. « 18 000 F ». */
  amount: string;
  state: OrderState;
  /** Étape suivante, `null` si la commande est au bout du parcours. */
  nextState: OrderState | null;
  createdAt: string;
}

/**
 * `GET /api/orders` — un client ne voit que ses propres commandes, le filtre
 * est appliqué côté serveur.
 *
 * ⚠️ **Il n'existe aucune route de création.** Le module `orders` du backend
 * n'expose que cette lecture et un `PATCH /:ref` réservé au backoffice pour
 * faire avancer l'état. `Order.state` vaut `PAYE` par défaut : une commande
 * n'existe qu'une fois l'argent reçu. L'app ne peut donc pas déclencher de
 * paiement — voir `PaymentScreen` et le README.
 */
export async function listOrders(): Promise<Order[]> {
  const { data } = await client.get<{ items: Order[] }>('/api/orders');
  return data.items;
}

export const ORDER_STEPS: OrderState[] = ['PAYE', 'EN_PRODUCTION', 'LIVRE'];

export const ORDER_LABELS: Record<OrderState, string> = {
  PAYE: 'Paiement reçu',
  EN_PRODUCTION: 'En cours de création',
  LIVRE: 'Livré',
  ARCHIVE: 'Archivé',
};
