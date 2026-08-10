import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';

/**
 * Lecture à voix haute (synthèse vocale du système).
 *
 * C'est la fonction d'accessibilité la plus utile de l'app : une partie du
 * public vise ne lit pas couramment. La synthèse est faite par le téléphone,
 * donc sans appel réseau ni consommation de forfait.
 *
 * Débit légèrement ralenti : la vitesse par défaut est pensée pour des lecteurs
 * habitués, elle est trop rapide pour une écoute attentive.
 */
const RATE = 0.9;
const LANGUAGE = 'fr-FR';

export interface SpeechControls {
  speaking: boolean;
  /** Lit le texte. Interrompt toute lecture en cours. */
  speak: (text: string) => void;
  stop: () => void;
  /** Lit, ou arrête si c'est déjà en train de lire. */
  toggle: (text: string) => void;
}

export function useSpeech(): SpeechControls {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    void Speech.stop();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    void Speech.stop();
    Speech.speak(text, {
      language: LANGUAGE,
      rate: RATE,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const toggle = useCallback(
    (text: string) => {
      if (speaking) stop();
      else speak(text);
    },
    [speaking, speak, stop],
  );

  // Quitter un écran doit couper la voix, sinon elle continue par-dessus le
  // suivant.
  useEffect(() => {
    return () => {
      void Speech.stop();
    };
  }, []);

  return { speaking, speak, stop, toggle };
}
