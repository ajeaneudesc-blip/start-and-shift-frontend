import { useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Halo } from '../components/effects/Halo';
import { SpeakButton } from '../components/ui/SpeakButton';
import { OptionsGrid } from '../components/diagnostic/OptionsGrid';
import { QuestionCard } from '../components/diagnostic/QuestionCard';
import { VocalRecorder } from '../components/diagnostic/VocalRecorder';
import { usePlatform } from '../hooks/usePlatform';
import { useDiagStore } from '../store/diagStore';
import { isEmpty } from '../api/diagnostic';
import { ANSWER_COUNT, QUESTIONS } from '../constants/questions';
import { Colors, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';

/**
 * Aide de saisie propre à la question 5 (index 4). Le backend y cherche un
 * séparateur « — » ou « ; » pour distinguer le problème de ce qui différencie
 * l'utilisateur. Sans séparateur, les deux moitiés de la stratégie reçoivent le
 * même texte : le résultat reste valide mais devient répétitif.
 */
const SEPARATOR_HELP =
  "Astuce : écrivez d'abord le problème, puis un tiret « — », puis ce que vous faites mieux.";

export function DiagnosticScreen({ navigation }: AppScreenProps<'Diagnostic'>) {
  const insets = useSafeAreaInsets();
  const { isWide } = usePlatform();

  const answers = useDiagStore((s) => s.answers);
  const step = useDiagStore((s) => s.step);
  const saveState = useDiagStore((s) => s.saveState);
  const loaded = useDiagStore((s) => s.loaded);
  const setAnswer = useDiagStore((s) => s.setAnswer);
  const toggleMulti = useDiagStore((s) => s.toggleMulti);
  const goTo = useDiagStore((s) => s.goTo);
  const load = useDiagStore((s) => s.load);
  const sync = useDiagStore((s) => s.sync);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const question = QUESTIONS[step];
  const answer = answers[step];

  // Les options font partie de la question : sans elles, quelqu'un qui écoute
  // au lieu de lire ne saurait pas entre quoi choisir.
  const questionSpoken = [
    question.t,
    question.h,
    ...(question.opts ? question.opts.map((o, i) => `Choix ${i + 1} : ${o}.`) : []),
  ].join(' ');

  const answered = !isEmpty(answer);
  const isLast = step === ANSWER_COUNT - 1;
  const answeredTotal = answers.filter((a) => !isEmpty(a)).length;

  async function next() {
    if (!answered) return;
    await sync();
    if (isLast) {
      navigation.navigate('Strategy');
    } else {
      goTo(step + 1);
    }
  }

  function previous() {
    if (step > 0) goTo(step - 1);
  }

  if (!loaded) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={Colors.blueMid} />
        <Text style={styles.loadingLabel}>Chargement de vos réponses…</Text>
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={previous}
          disabled={step === 0}
          accessibilityRole="button"
          accessibilityLabel="Question précédente"
          style={[styles.back, step === 0 && styles.backDisabled]}
        >
          <Icon name="arrow-left" size={19} />
        </Pressable>

        <Text style={styles.stepLabel}>
          {question.sec} · {step + 1} / {ANSWER_COUNT}
        </Text>

        <SaveBadge state={saveState} />
      </View>

      <ProgressBar total={ANSWER_COUNT} current={step} completed={answeredTotal} />
    </View>
  );

  const prompt = (
    <View style={isWide ? styles.leftPanel : undefined}>
      <QuestionCard title={question.t} hint={question.h} step={step} />

      {/*
        Écouter la question résout la moitié « lecture » de la difficulté.
        La moitié « écriture » — répondre à la voix — attend une transcription
        automatique, qui n'existe dans aucun module Expo (voir README).
      */}
      <SpeakButton text={questionSpoken} label="Écouter la question" />
    </View>
  );

  const field = (
    <View style={isWide ? styles.rightPanel : styles.fieldMobile}>
      {question.type === 'free' ? (
        <View style={styles.freeAnswer}>
          <Input
            value={typeof answer === 'string' ? answer : ''}
            onChangeText={(v) => setAnswer(step, v)}
            placeholder={question.ph}
            multiline
            autoCapitalize="sentences"
          />
          {step === 4 ? <Text style={styles.help}>{SEPARATOR_HELP}</Text> : null}

          {/*
            La dictée n'est proposée que sur les réponses libres. Sur les
            questions à choix, il faudrait rapprocher une phrase dictée d'un
            libellé exact — or ces libellés pilotent le calcul de la stratégie
            au caractère près. Écouter la question puis toucher son choix est
            plus sûr, et tout aussi accessible.
          */}
          <VocalRecorder
            value={typeof answer === 'string' ? answer : ''}
            onChange={(v) => setAnswer(step, v)}
          />
        </View>
      ) : (
        <OptionsGrid
          options={question.opts ?? []}
          answer={answer}
          multi={question.type === 'multi'}
          max={question.max}
          step={step}
          onSelect={(option) =>
            question.type === 'multi'
              ? toggleMulti(step, option, question.max)
              : setAnswer(step, option)
          }
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Même halo bleu que l'écran d'inscription, en retrait : il éclaire
          l'en-tête sans concurrencer l'énoncé de la question. */}
      <Halo />

      <View style={{ paddingTop: insets.top + Spacing.sm }}>{header}</View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isWide ? styles.twoColumns : styles.oneColumn}>
          {prompt}
          {field}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          label={isLast ? 'Voir ma stratégie' : 'Continuer'}
          onPress={next}
          disabled={!answered}
        />
        {!answered ? (
          <Text style={styles.footerHint}>
            {question.type === 'multi'
              ? 'Choisissez au moins une réponse.'
              : 'Répondez pour continuer.'}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function SaveBadge({ state }: { state: ReturnType<typeof useDiagStore.getState>['saveState'] }) {
  if (state === 'idle') return <View style={styles.badgeSpacer} />;

  const config = {
    saving: { icon: 'clock' as const, label: 'Enregistrement…', color: Colors.textFaint },
    saved: { icon: 'check' as const, label: 'Enregistré', color: Colors.success },
    // « Sur l'appareil » plutôt que « Erreur » : rien n'est perdu, le serveur
    // sera rattrapé plus tard. Inutile d'inquiéter sur une coupure réseau,
    // qui est la norme et non l'exception ici.
    local: { icon: 'clock' as const, label: "Sur l'appareil", color: Colors.orange },
  }[state];

  return (
    <View style={styles.badge} accessibilityLiveRegion="polite">
      <Icon name={config.icon} size={13} color={config.color} />
      <Text style={[styles.badgeLabel, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingLabel: { fontSize: 14, color: Colors.textMuted },

  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  back: {
    width: 44,
    height: 40,
    marginLeft: -Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backDisabled: { opacity: 0.3 },
  stepLabel: { flex: 1, fontSize: 10, letterSpacing: 2, color: Colors.blueMid },
  badge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2 },
  badgeSpacer: { height: 18 },
  badgeLabel: { fontSize: 12 },

  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  oneColumn: { gap: Spacing.xl, width: '100%', maxWidth: 560, alignSelf: 'center' },
  twoColumns: { flexDirection: 'row', gap: Spacing.xxl, maxWidth: 1100, alignSelf: 'center' },
  leftPanel: { width: 300, flexShrink: 0 },
  rightPanel: { flex: 1 },
  fieldMobile: { width: '100%' },

  freeAnswer: { gap: Spacing.lg },
  help: {
    marginTop: Spacing.md,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textFaint,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    gap: Spacing.sm,
  },
  footerHint: { fontSize: 13, color: Colors.textFaint, textAlign: 'center' },
});
