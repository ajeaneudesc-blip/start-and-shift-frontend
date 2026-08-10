import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { SelectableRow } from '../../components/ui/SelectableRow';
import { SpeakButton } from '../../components/ui/SpeakButton';
import { Consent, useAuthStore } from '../../store/authStore';
import { Colors, Radius, Spacing } from '../../theme/tokens';
import type { AuthScreenProps } from '../../navigation/types';

const ITEMS: { label: string; hint: string }[] = [
  { label: 'Mes réponses servent à créer mon identité visuelle.', hint: 'OBLIGATOIRE' },
  { label: "Un assistant peut me contacter dans l'app.", hint: 'RECOMMANDÉ' },
  { label: 'Recevoir des conseils par SMS.', hint: 'FACULTATIF' },
];

const TITRE = 'Avant de commencer';
const INTRO =
  'Vos réponses servent uniquement à créer votre identité. Vous pouvez tout effacer quand vous voulez.';

/**
 * Ce qui est lu à voix haute. On énonce le caractère obligatoire ou facultatif
 * de chaque case : c'est l'information qui engage l'utilisateur, elle ne doit
 * pas être réservée à ceux qui lisent les petites capitales.
 */
const PAGE_TEXTE = [
  TITRE + '.',
  INTRO,
  ...ITEMS.map((item, i) => `Case ${i + 1}, ${item.hint.toLowerCase()} : ${item.label}`),
].join(' ');

export function ConsentScreen({ navigation }: AuthScreenProps<'Consent'>) {
  const insets = useSafeAreaInsets();
  const setConsent = useAuthStore((s) => s.setConsent);

  // Le prototype pré-coche la case obligatoire. On ne le fait pas : un
  // consentement pré-coché n'est pas un consentement. À confirmer avec le
  // juriste togolais, mais décocher par défaut est le choix prudent.
  const [values, setValues] = useState<Consent>([false, false, false]);
  const [saving, setSaving] = useState(false);

  const accepted = values[0];

  function toggle(index: number) {
    const next = [...values] as Consent;
    next[index] = !next[index];
    setValues(next);
  }

  async function start() {
    if (!accepted) return;
    setSaving(true);
    // Une fois le consentement enregistré, RootNavigator bascule tout seul
    // vers l'AppStack : pas de navigation explicite à faire ici.
    await setConsent(values);
    setSaving(false);
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Revenir à l'inscription"
        style={styles.back}
      >
        <Icon name="arrow-left" size={20} />
      </Pressable>

      <View style={styles.badge}>
        <Icon name="shield" size={24} color={Colors.blueMid} />
      </View>

      <Text style={styles.title}>{TITRE}</Text>
      <Text style={styles.intro}>{INTRO}</Text>

      <View style={styles.items}>
        {ITEMS.map((item, i) => (
          <SelectableRow
            key={item.label}
            label={item.label}
            hint={item.hint}
            shape="square"
            selected={values[i]}
            onPress={() => toggle(i)}
          />
        ))}
      </View>

      {/*
        Lecture par la synthèse vocale du téléphone : aucun appel réseau, donc
        rien à payer, et cela fonctionne là où l'utilisateur ne lit pas
        couramment — c'est-à-dire au moment précis où on lui demande
        d'accepter quelque chose.
      */}
      <SpeakButton text={PAGE_TEXTE} label="Écouter cette page" />

      <View style={styles.spacer} />

      <Button
        label={accepted ? "J'accepte et je commence" : 'Cochez la première case'}
        onPress={start}
        disabled={!accepted}
        loading={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 52,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(9,92,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  items: { gap: Spacing.sm, marginBottom: Spacing.lg },
  spacer: { flex: 1, minHeight: Spacing.xl },
});
