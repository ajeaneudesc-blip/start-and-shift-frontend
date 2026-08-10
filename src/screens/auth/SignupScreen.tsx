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
import { apiErrorMessage } from '../../api/client';
import {
  createSession,
  digitsOnly,
  formatLocalPhone,
  isValidLocalPhone,
  PHONE_LOCAL_LENGTH,
  PHONE_PREFIX,
  toE164,
} from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Colors, Radius, Spacing } from '../../theme/tokens';
import type { AuthScreenProps } from '../../navigation/types';

export function SignupScreen({ navigation }: AuthScreenProps<'Signup'>) {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [firstName, setFirstName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<'firstName' | 'pseudo' | 'phone' | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
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
      const { token, user } = await createSession({
        phone: toE164(phone),
        firstName: firstName.trim(),
        pseudo: pseudo.trim(),
      });
      await setAuth(token, user);
      navigation.navigate('Consent');
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
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.brand}>START AND SHIFT</Text>
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.subtitle}>
            Pas de mot de passe, pas de code par SMS. Votre numéro suffit.
          </Text>

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

          <Button
            label="Créer mon compte"
            onPress={submit}
            loading={loading}
            style={styles.cta}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>OU</Text>
            <View style={styles.divider} />
          </View>

          {/*
            Gmail est présent dans la maquette mais aucune route OAuth n'existe
            côté backend (l'authentification se fait par numéro seul). Le bouton
            est donc désactivé plutôt que trompeur.
          */}
          <Button
            label="Continuer avec Gmail"
            variant="secondary"
            onPress={() => {}}
            disabled
            accessibilityLabel="Continuer avec Gmail — pas encore disponible"
          />
          <Text style={styles.soon}>Bientôt disponible</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    padding: Spacing.xl,
  },
  brand: {
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: Colors.textPrimary,
  },
  title: {
    marginTop: Spacing.lg,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
  },
  fields: { gap: Spacing.md },
  error: {
    marginTop: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.danger,
  },
  cta: { marginTop: Spacing.xl },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontSize: 11, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' },
  soon: {
    marginTop: Spacing.sm,
    alignSelf: 'center',
    fontSize: 12,
    color: Colors.textFaint,
  },
});
