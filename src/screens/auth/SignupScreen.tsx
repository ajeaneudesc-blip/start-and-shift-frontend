import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FadeIn } from '../../components/effects/FadeIn';
import { GlowBorder } from '../../components/effects/GlowBorder';
import { Halo } from '../../components/effects/Halo';
import { apiErrorMessage } from '../../api/client';
import {
  digitsOnly,
  formatLocalPhone,
  isValidLocalPhone,
  PHONE_LOCAL_LENGTH,
  PHONE_PREFIX,
  requestSession,
  toE164,
  verifyOtp,
} from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Colors, Fonts, Gradients, Motion, Radius, Spacing } from '../../theme/tokens';
import type { AuthScreenProps } from '../../navigation/types';

const OTP_LENGTH = 6;

/** Remplissage translucide du panneau, tel que le prototype le pose sur le halo. */
const PANEL_FILL = [
  'rgba(26,26,30,0.46)',
  'rgba(14,14,17,0.34)',
  'rgba(10,10,12,0.30)',
] as const;
const PANEL_STOPS = [0, 0.55, 1] as const;

export function SignupScreen({ navigation }: AuthScreenProps<'Signup'>) {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  // L'étape « otp » ne concerne plus que les comptes équipe : le serveur ne
  // renvoie `verified: false` que pour eux. Un client ne la voit jamais.
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [firstName, setFirstName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<'firstName' | 'pseudo' | 'phone' | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitPhone() {
    setError(null);
    setFieldError(null);

    if (!firstName.trim()) {
      setFieldError('firstName');
      setError('Écrivez votre prénom.');
      return;
    }
    if (!pseudo.trim()) {
      setFieldError('pseudo');
      setError('Choisissez un pseudo.');
      return;
    }
    if (!isValidLocalPhone(phone)) {
      setFieldError('phone');
      setError(`Le numéro doit avoir ${PHONE_LOCAL_LENGTH} chiffres.`);
      return;
    }

    setLoading(true);
    try {
      const result = await requestSession({
        phone: toE164(phone),
        firstName: firstName.trim(),
        pseudo: pseudo.trim(),
      });
      if (result.verified) {
        // Parcours client : plus d'écran de consentement, la navigation bascule
        // seule sur le Diagnostic dès que le token est posé (RootNavigator).
        await setAuth(result.token, result.user);
        return;
      }
      setSessionToken(result.sessionToken);
      setCode('');
      setStep('otp');
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    setError(null);
    if (code.length !== OTP_LENGTH) {
      setError(`Le code a ${OTP_LENGTH} chiffres.`);
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await verifyOtp(sessionToken, code);
      await setAuth(token, user);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Halo bleu du prototype : centré au-dessus du bord haut, il éclaire le
          tiers supérieur de l'écran. Posé hors du ScrollView pour rester fixe
          quand le clavier pousse le contenu. */}
      <Halo />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn duration={Motion.enterSlow}>
          <GlowBorder
            radius={Radius.xl}
            fill={PANEL_FILL}
            fillStops={PANEL_STOPS}
            edge={Gradients.edgeStrong}
            style={styles.card}
            contentStyle={styles.cardInner}
          >
            {step === 'form' ? (
              <>
                <Text style={styles.title}>Inscription</Text>

                <View style={styles.fields}>
                  <Input
                    label="Prénom"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Amina"
                    autoCapitalize="words"
                    error={fieldError === 'firstName' ? ' ' : null}
                  />
                  <Input
                    label="Pseudo"
                    prefix="@"
                    value={pseudo}
                    onChangeText={(v) => setPseudo(v.replace(/^@+/, ''))}
                    placeholder="amina.k"
                    autoCapitalize="none"
                    error={fieldError === 'pseudo' ? ' ' : null}
                  />
                  <Input
                    label="Numéro"
                    prefix={PHONE_PREFIX}
                    value={formatLocalPhone(phone)}
                    onChangeText={(v) => setPhone(digitsOnly(v).slice(0, PHONE_LOCAL_LENGTH))}
                    placeholder="90 00 00 00"
                    keyboardType="number-pad"
                    error={fieldError === 'phone' ? ' ' : null}
                  />
                </View>

                {error ? (
                  <Text style={styles.error} accessibilityLiveRegion="assertive">
                    {error}
                  </Text>
                ) : null}

                {/* Le prototype réserve ici une ligne de 11 px avant le bouton.
                    C'est la place du consentement, qui n'a plus d'écran à lui :
                    la mention reste affichée, donc opposable, sans ajouter une
                    étape à un parcours qu'on veut tenir en un seul écran. */}
                <Text style={styles.consent}>
                  En créant votre compte, vous acceptez que START AND SHIFT utilise vos réponses
                  pour préparer votre stratégie de marque.
                </Text>

                <Button
                  label="Créer mon compte"
                  onPress={submitPhone}
                  loading={loading}
                  arrow
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>Votre code</Text>
                <Text style={styles.subtitle}>
                  Envoyé par SMS au {PHONE_PREFIX} {formatLocalPhone(phone)}.
                </Text>

                <View style={styles.fields}>
                  <Input
                    label="Code reçu"
                    value={code}
                    onChangeText={(v) => setCode(digitsOnly(v).slice(0, OTP_LENGTH))}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    autoFocus
                  />
                </View>

                {error ? (
                  <Text style={styles.error} accessibilityLiveRegion="assertive">
                    {error}
                  </Text>
                ) : null}

                <Button label="Confirmer" onPress={submitCode} loading={loading} arrow />
                <Button
                  label="Modifier le numéro"
                  variant="secondary"
                  onPress={() => setStep('form')}
                  disabled={loading}
                  style={styles.secondaryCta}
                />
              </>
            )}
          </GlowBorder>
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    // 26 px : la marge du cadre dans le prototype.
    paddingHorizontal: Spacing.xxxl,
  },
  card: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  cardInner: { padding: 16 },
  title: {
    marginBottom: 13,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: -6,
    marginBottom: Spacing.xl,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  // 9 px entre deux champs, valeur du prototype.
  fields: { gap: 9 },
  error: {
    marginTop: Spacing.md,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.regular,
    color: Colors.danger,
  },
  consent: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Fonts.regular,
    color: Colors.textFaint,
  },
  secondaryCta: { marginTop: Spacing.smd },
});
