import { useCallback, useEffect, useRef, useState } from 'react';
import { ConvStatus, Message, toMessage } from '../api/conversations';
import { useAuthStore } from '../store/authStore';

export type WsStatus = 'connecting' | 'open' | 'closed';

/** Reconnexion : 1 s, 2 s, 4 s, 8 s, 16 s, puis 30 s — plafond fixé par le backend. */
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

function backoffDelay(attempt: number): number {
  const raw = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  // Un peu d'aléa : après une coupure réseau à Lomé, tous les téléphones
  // reviennent en même temps. Sans ce décalage ils frapperaient le serveur à la
  // même seconde.
  return Math.round(raw * (0.8 + Math.random() * 0.4));
}

interface UseWebSocketOptions {
  conversationId: number;
  /** Appelé pour chaque message entrant concernant cette conversation. */
  onMessage: (msg: Message) => void;
  onStatusChange?: (status: ConvStatus) => void;
}

interface UseWebSocketResult {
  status: WsStatus;
  /** Signale au serveur que le fil a été lu. Sans effet si le socket est fermé. */
  markRead: () => void;
}

/**
 * Connexion temps réel à `ws://<hôte>/ws?token=<jwt>`.
 *
 * L'authentification a lieu pendant la poignée de main : un token invalide
 * reçoit un 401 HTTP et le socket ne s'ouvre jamais. On n'a rien de spécial à
 * faire pour ce cas — la première requête REST de l'écran déclenchera la
 * déconnexion, et le composant sera démonté.
 *
 * Le serveur envoie un ping protocolaire (auquel la plateforme répond seule) et
 * un `{"type":"ping"}` applicatif toutes les 30 s. Ce dernier n'attend aucune
 * réponse : il sert à traverser les proxys qui avalent les trames de contrôle.
 */
export function useWebSocket({
  conversationId,
  onMessage,
  onStatusChange,
}: UseWebSocketOptions): UseWebSocketResult {
  const token = useAuthStore((s) => s.token);
  const [status, setStatus] = useState<WsStatus>('connecting');

  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const closedByUsRef = useRef(false);

  // Les rappels changent d'identité à chaque rendu du parent. En passant par
  // des refs, on évite de fermer et rouvrir le socket à chaque frappe clavier.
  const onMessageRef = useRef(onMessage);
  const onStatusRef = useRef(onStatusChange);
  useEffect(() => {
    onMessageRef.current = onMessage;
    onStatusRef.current = onStatusChange;
  }, [onMessage, onStatusChange]);

  useEffect(() => {
    if (!token) {
      setStatus('closed');
      return;
    }

    closedByUsRef.current = false;

    const connect = () => {
      setStatus('connecting');

      const url = `${process.env.EXPO_PUBLIC_WS_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setStatus('open');
      };

      ws.onmessage = (event) => {
        let payload: {
          type?: string;
          convId?: number;
          msg?: Parameters<typeof toMessage>[0];
          status?: ConvStatus;
        };
        try {
          payload = JSON.parse(String(event.data));
        } catch {
          return;
        }

        // Le ping applicatif n'appelle aucune réponse côté client.
        if (payload.type === 'ping') return;
        if (payload.convId !== conversationId) return;

        if (payload.type === 'conv:msg' && payload.msg) {
          onMessageRef.current(toMessage(payload.msg));
        } else if (payload.type === 'conv:status' && payload.status) {
          onStatusRef.current?.(payload.status);
        }
      };

      const scheduleReconnect = () => {
        if (closedByUsRef.current) return;
        setStatus('closed');
        const delay = backoffDelay(attemptRef.current);
        attemptRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onclose = scheduleReconnect;
      // `onerror` est suivi d'un `onclose` sur toutes les plateformes ; on ne
      // planifie donc rien ici pour ne pas doubler les tentatives.
      ws.onerror = () => {};
    };

    connect();

    return () => {
      closedByUsRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [token, conversationId]);

  const markRead = useCallback(() => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'conv:read', convId: conversationId }));
    }
  }, [conversationId]);

  return { status, markRead };
}
