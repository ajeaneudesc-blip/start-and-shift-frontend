import client from './client';

export type PaygateNetwork = 'TMONEY' | 'FLOOZ';
export type PaymentRequestStatus = 'EN_ATTENTE' | 'REUSSI' | 'ECHEC' | 'EXPIRE' | 'ANNULE';

export interface PaymentRequestRow {
  identifier: string;
  network: PaygateNetwork;
  phoneNumber: string;
  amountFCFA: number;
  status: PaymentRequestStatus;
  createdAt: string;
  confirmedAt: string | null;
}

export interface InitiatePaymentInput {
  network: PaygateNetwork;
  /** Format E.164 : `+228` suivi de 8 chiffres. */
  phoneNumber: string;
  amountFCFA: number;
  description?: string;
}

/**
 * `POST /api/payments` — déclenche un prompt de paiement PayGate sur le
 * téléphone du client. Sans réessai : chaque appel crée une nouvelle demande
 * (identifiant généré côté serveur), donc un réessai automatique après une
 * réponse perdue enverrait un second prompt pour le même paiement.
 */
export async function initiatePayment(input: InitiatePaymentInput): Promise<PaymentRequestRow> {
  const { data } = await client.post<PaymentRequestRow>('/api/payments', input, { noRetry: true });
  return data;
}

/** `GET /api/payments/:identifier` — statut courant, revérifié auprès de PayGate côté serveur. */
export async function getPaymentStatus(identifier: string): Promise<PaymentRequestRow> {
  const { data } = await client.get<PaymentRequestRow>(
    `/api/payments/${encodeURIComponent(identifier)}`,
    { timeout: 10000, noRetry: true },
  );
  return data;
}
