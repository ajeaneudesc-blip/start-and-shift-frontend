import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export type DictationPhase =
  | 'idle'
  /** Le micro écoute. */
  | 'listening'
  /** Permission refusée par l'utilisateur. */
  | 'denied';

export interface Dictation {
  phase: DictationPhase;
  /** Ce qui a été reconnu, partie encore provisoire comprise. */
  transcript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

const LANGUAGE = 'fr-FR';

/**
 * Reconnaissance hors ligne. `false` fait passer par le moteur en ligne, plus
 * fiable partout ; `true` force le moteur embarqué d'Android, qui ne consomme
 * pas de forfait mais exige que le pack de langue français soit installé sur
 * l'appareil — sinon la reconnaissance échoue.
 *
 * Laissé à `false` faute d'avoir pu l'éprouver sur un téléphone togolais réel.
 * À basculer dès qu'un test terrain confirme que le pack français est présent :
 * l'économie de données est loin d'être négligeable ici.
 */
const PREFER_ON_DEVICE = false;

/** Codes d'erreur du moteur, traduits en phrases utilisables. */
const ERRORS: Record<string, string> = {
  'no-speech': "Je n'ai rien entendu. Rapprochez le téléphone et réessayez.",
  'audio-capture': "Le micro n'est pas accessible.",
  'not-allowed': 'Le micro est refusé.',
  'service-not-allowed': "La reconnaissance vocale n'est pas disponible sur cet appareil.",
  'language-not-supported': "Le français n'est pas installé pour la reconnaissance vocale.",
  network: 'Pas de connexion pour la reconnaissance vocale.',
  aborted: '',
};

export function useDictation(): Dictation {
  const [phase, setPhase] = useState<DictationPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  // Les segments définitifs s'accumulent ; la partie provisoire est remplacée
  // à chaque événement, sinon le texte se répéterait pendant qu'on parle.
  const [settled, setSettled] = useState('');
  const [interim, setInterim] = useState('');
  const settledRef = useRef('');

  useSpeechRecognitionEvent('result', (event) => {
    const best = event.results?.[0]?.transcript ?? '';
    if (event.isFinal) {
      settledRef.current = `${settledRef.current} ${best}`.trim();
      setSettled(settledRef.current);
      setInterim('');
    } else {
      setInterim(best);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setInterim('');
    setPhase((current) => (current === 'denied' ? current : 'idle'));
  });

  useSpeechRecognitionEvent('error', (event) => {
    const message = ERRORS[event.error] ?? "La reconnaissance vocale s'est arrêtée.";
    // `aborted` correspond à un arrêt volontaire : ce n'est pas une erreur.
    if (message) setError(message);
    setPhase(event.error === 'not-allowed' ? 'denied' : 'idle');
  });

  const start = useCallback(async () => {
    setError(null);

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setPhase('denied');
      return;
    }

    settledRef.current = '';
    setSettled('');
    setInterim('');

    try {
      ExpoSpeechRecognitionModule.start({
        lang: LANGUAGE,
        // Le texte apparaît au fur et à mesure : c'est le seul retour visuel
        // qui montre que ça marche à quelqu'un qui ne relira pas.
        interimResults: true,
        // Sans cela, la reconnaissance s'arrête au premier silence — or une
        // personne qui cherche ses mots fait des pauses.
        continuous: true,
        requiresOnDeviceRecognition: PREFER_ON_DEVICE,
      });
      setPhase('listening');
    } catch {
      setError("La reconnaissance vocale n'a pas pu démarrer.");
      setPhase('idle');
    }
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setPhase('idle');
  }, []);

  const reset = useCallback(() => {
    settledRef.current = '';
    setSettled('');
    setInterim('');
    setError(null);
    setPhase('idle');
  }, []);

  const transcript = [settled, interim].filter(Boolean).join(' ');

  return { phase, transcript, error, start, stop, reset };
}
