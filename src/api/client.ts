import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * Désactive les réessais automatiques pour cette requête. À utiliser quand
     * la réponse pilote quelque chose de visible à l'écran : mieux vaut un
     * verdict rapide, quitte à le corriger, qu'un affichage faux pendant que
     * les réessais s'épuisent.
     */
    noRetry?: boolean;
  }
}

export const TOKEN_KEY = 'jwt';

/**
 * Délai des « sondes » : les appels déclenchés automatiquement dont le résultat
 * alimente un indicateur. 8 s, sans réessai.
 *
 * La politique générale (15 s + 2 réessais) peut laisser passer près de 40 s
 * avant de conclure. C'est acceptable pour un envoi en arrière-plan ; ça ne
 * l'est pas pour une pastille de présence, qui afficherait « En ligne » tout
 * ce temps alors que l'appareil ne joint rien.
 */
export const PROBE_TIMEOUT_MS = 8000;

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000, // 15 s : contrainte réseau Togo (FRONTEND_SPEC §10)
});

/**
 * Copie du token en mémoire : évite une lecture disque AsyncStorage à chaque
 * requête, ce qui est sensible sur les Android d'entrée de gamme. AsyncStorage
 * reste consulté au démarrage à froid, avant que le store ait été réhydraté.
 */
let memoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

/** Appelé quand le serveur répond 401 : le store d'auth s'y branche. */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

client.interceptors.request.use(async (config) => {
  const token = memoryToken ?? (await AsyncStorage.getItem(TOKEN_KEY));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  noRetry?: boolean;
};

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as RetryableConfig | undefined;

    // `!err.response` = la requête n'est jamais arrivée (coupure, DNS, timeout).
    // On ne réessaie que ce cas : un 4xx réessayé donnerait deux fois la même
    // erreur, et un 5xx réessayé peut aggraver une surcharge serveur.
    //
    // Réessayer un POST est sans danger ici : toutes les routes d'écriture de
    // cette API sont idempotentes (auth/session cherche-ou-crée par numéro,
    // strategy fait un upsert, conversations est protégée par un verrou
    // consultatif Postgres). Si une route non idempotente apparaît, il faudra
    // restreindre ce retry aux méthodes GET/PUT.
    if (config && !err.response && !config.noRetry) {
      const attempt = config._retryCount ?? 0;
      if (attempt < 2) {
        config._retryCount = attempt + 1;
        await new Promise((r) => setTimeout(r, 1000 * config._retryCount!));
        return client(config);
      }
    }

    if (err.response?.status === 401) onUnauthorized?.();

    return Promise.reject(err);
  },
);

/** Code d'erreur renvoyé par l'API (`{ "error": "..." }`), ou pseudo-code réseau. */
export function apiErrorCode(e: unknown): string | null {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: unknown } | undefined;
    if (data && typeof data.error === 'string') return data.error;
    if (!e.response) return 'network_error';
  }
  return null;
}

/**
 * Champ supplémentaire d'un corps d'erreur JSON de l'API. Sert au cas du
 * paiement : un 503 renvoie l'`identifier` de la demande créée, qui reste
 * valable côté serveur même si l'appel au fournisseur a échoué.
 */
export function apiErrorField(e: unknown, field: string): string | null {
  if (!axios.isAxiosError(e)) return null;
  const data = e.response?.data as Record<string, unknown> | undefined;
  const value = data?.[field];
  return typeof value === 'string' ? value : null;
}

/**
 * Messages destinés à des personnes qui lisent peu : phrases courtes, aucun
 * terme technique, et toujours une action à faire.
 */
const MESSAGES: Record<string, string> = {
  network_error: 'Pas de connexion. Vérifiez votre réseau, puis réessayez.',
  invalid_phone: 'Ce numéro ne va pas. Il faut 8 chiffres après le +228.',
  missing_firstName: 'Il manque votre prénom.',
  missing_pseudo: 'Il manque votre pseudo.',
  pseudo_taken: 'Ce pseudo est déjà pris. Essayez-en un autre.',
  account_suspended: 'Ce compte est suspendu. Contactez-nous.',
  too_many_requests: "Trop d'essais. Attendez quelques minutes avant de réessayer.",
  sms_delivery_failed: "Le SMS n'a pas pu partir. Vérifiez votre numéro, puis redemandez un code.",
  invalid_code: 'Ce code ne correspond pas. Vérifiez le SMS et réessayez.',
  invalid_session: 'Ce code a expiré. Demandez-en un nouveau.',
  expired: 'Ce code a expiré. Demandez-en un nouveau.',
  too_many_attempts: 'Trop de codes faux. Demandez-en un nouveau.',
  unauthorized: 'Votre session a expiré. Reconnectez-vous.',
  invalid_token: 'Votre session a expiré. Reconnectez-vous.',
  diagnostic_missing: 'Vos réponses sont introuvables. Reprenez le diagnostic.',
  diagnostic_incomplete: 'Il reste des questions sans réponse.',
  answers_must_be_array: "Vos réponses n'ont pas pu être enregistrées.",
  too_many_answers: "Vos réponses n'ont pas pu être enregistrées.",
  internal_error: 'Le serveur a un problème. Réessayez dans un instant.',
  not_found: "Cette page n'existe pas sur le serveur.",
};

export function apiErrorMessage(e: unknown): string {
  const code = apiErrorCode(e);
  if (code && MESSAGES[code]) return MESSAGES[code];
  return 'Une erreur est survenue. Réessayez.';
}

export default client;
