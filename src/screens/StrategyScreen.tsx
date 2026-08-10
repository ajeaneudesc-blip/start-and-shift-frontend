import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { ActionsList } from '../components/strategy/ActionsList';
import { StrategyCard } from '../components/strategy/StrategyCard';
import { generateStrategy, Strategy } from '../api/strategy';
import { apiErrorCode, apiErrorMessage } from '../api/client';
import { isEmpty } from '../api/diagnostic';
import { useDiagStore } from '../store/diagStore';
import { ANSWER_COUNT } from '../constants/questions';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

/**
 * Le calcul serveur est quasi instantané. En dessous de ce seuil, l'anneau ne
 * ferait que clignoter — ce qui se lit comme un bug plutôt que comme de la
 * rapidité. On le laisse donc vivre un court instant.
 */
const MIN_LOADER_MS = 700;

/** Au-delà, on prévient que c'est le réseau qui traîne, pas l'app. */
const SLOW_NETWORK_MS = 6000;

type Phase = 'loading' | 'ready' | 'error';

export function StrategyScreen({ navigation }: AppScreenProps<'Strategy'>) {
  const insets = useSafeAreaInsets();
  const answers = useDiagStore((s) => s.answers);
  const goTo = useDiagStore((s) => s.goTo);

  const [phase, setPhase] = useState<Phase>('loading');
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [error, setError] = useState<{ code: string | null; message: string } | null>(null);
  const [slow, setSlow] = useState(false);

  // Évite un setState après démontage si l'utilisateur quitte pendant l'appel.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setSlow(false);

    const startedAt = Date.now();
    const slowTimer = setTimeout(() => {
      if (alive.current) setSlow(true);
    }, SLOW_NETWORK_MS);

    try {
      const result = await generateStrategy();
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADER_MS - elapsed));
      }
      if (!alive.current) return;
      setStrategy(result);
      setPhase('ready');
    } catch (e) {
      if (!alive.current) return;
      setError({ code: apiErrorCode(e), message: apiErrorMessage(e) });
      setPhase('error');
    } finally {
      clearTimeout(slowTimer);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  /** Renvoie vers la première question restée sans réponse. */
  function editAnswers() {
    const first = answers.findIndex((a) => isEmpty(a));
    goTo(first === -1 ? 0 : first);
    navigation.navigate('Diagnostic');
  }

  if (phase === 'loading') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Loader label="Nous construisons votre stratégie" />
        <View style={styles.loadingText}>
          <Text style={styles.loadingTitle}>Nous construisons votre stratégie</Text>
          <Text style={styles.loadingBody}>
            Vos {ANSWER_COUNT} réponses sont enregistrées. Vous pouvez fermer l'app.
          </Text>
          {slow ? (
            <Text style={styles.loadingSlow} accessibilityLiveRegion="polite">
              Le réseau est lent. Rien n'est perdu, laissez l'écran ouvert.
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (phase === 'error') {
    const incomplete =
      error?.code === 'diagnostic_incomplete' || error?.code === 'diagnostic_missing';

    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>La stratégie n'a pas pu être créée.</Text>
          <Text style={styles.errorBody}>{error?.message}</Text>
        </View>
        <View style={styles.errorActions}>
          {incomplete ? (
            <Button label="Compléter mes réponses" onPress={editAnswers} />
          ) : (
            <Button label="Réessayer" onPress={() => void run()} />
          )}
          <Button label="Revenir à mes réponses" variant="secondary" onPress={editAnswers} />
        </View>
      </View>
    );
  }

  if (!strategy) return null;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl },
      ]}
    >
      <Text style={styles.eyebrow}>PROPOSITION · {ANSWER_COUNT} RÉPONSES</Text>
      <Text style={styles.title} accessibilityRole="header">
        Votre stratégie de marque
      </Text>

      <View style={styles.sections}>
        <StrategyCard label="POSITIONNEMENT" variant="positioning">
          <Text style={styles.posText}>{strategy.pos}</Text>
        </StrategyCard>

        <StrategyCard label="PUBLICS PRIORITAIRES">
          <View style={styles.chips}>
            {strategy.cibles.map((cible, i) => (
              <View key={`${i}-${cible}`} style={styles.chip}>
                <Text style={styles.chipLabel}>{cible}</Text>
              </View>
            ))}
          </View>
        </StrategyCard>

        <StrategyCard label="TON ET COULEURS">
          <View style={styles.toneRow}>
            {/*
              Les trois pastilles sont les couleurs de la marque START AND SHIFT,
              pas des couleurs déduites des réponses : le backend ne renvoie
              aucune palette. C'est ce que fait le prototype. Si la palette doit
              un jour dépendre du diagnostic, cela se décide côté serveur.
            */}
            <View style={[styles.swatch, { backgroundColor: Colors.blue }]} />
            <View style={[styles.swatch, { backgroundColor: Colors.orange }]} />
            <View style={[styles.swatch, { backgroundColor: Colors.textPrimary }]} />
            <Text style={styles.toneText}>{strategy.ton}</Text>
          </View>
        </StrategyCard>

        <StrategyCard label="TROIS ACTIONS À MENER">
          <ActionsList actions={strategy.actions} />
        </StrategyCard>

        <StrategyCard label="CE QUI VOUS DIFFÉRENCIE" variant="accent">
          <Text style={styles.diffText}>{strategy.diff}</Text>
        </StrategyCard>
      </View>

      <View style={styles.actions}>
        <Button label="Passer à la réalisation" onPress={() => navigation.navigate('Relation')} />
        <Button label="Modifier mes réponses" variant="secondary" onPress={editAnswers} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xxl,
  },

  loadingText: { alignItems: 'center', gap: Spacing.sm, maxWidth: 340 },
  loadingTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  loadingBody: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loadingSlow: {
    marginTop: Spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.orange,
    textAlign: 'center',
  },

  errorBox: { maxWidth: 420, gap: Spacing.sm },
  errorTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  errorActions: { width: '100%', maxWidth: 420, gap: Spacing.md },

  scroll: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: Colors.blueMid },
  title: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sections: { gap: Spacing.md },

  posText: { fontSize: 15, lineHeight: 25, fontWeight: '500', color: Colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md + 1,
    borderRadius: 11,
    backgroundColor: Colors.chipBg,
  },
  chipLabel: { fontSize: 14, color: Colors.textPrimary },
  toneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  swatch: { width: 36, height: 36, borderRadius: Radius.md },
  toneText: { flex: 1, minWidth: 180, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.66)' },
  diffText: { fontSize: 15, lineHeight: 23, color: Colors.textPrimary },

  actions: { marginTop: Spacing.xl, gap: Spacing.md },
});
