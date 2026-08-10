import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ConsentScreen } from '../screens/auth/ConsentScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';
import { StrategyScreen } from '../screens/StrategyScreen';
import { RelationScreen } from '../screens/RelationScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { TrackingScreen } from '../screens/TrackingScreen';
import { hasRequiredConsent, useAuthStore } from '../store/authStore';
import { Colors } from '../theme/tokens';
import type { AppStackParamList, AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    primary: Colors.blue,
  },
};

export function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const consent = useAuthStore((s) => s.consent);

  // Tant que le token n'est pas relu du disque, afficher l'inscription ferait
  // clignoter l'écran chez un utilisateur déjà connecté.
  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Colors.blueMid} />
      </View>
    );
  }

  // Le consentement fait partie de la porte d'entrée : un compte créé mais
  // sans case cochée reste dans l'AuthStack. C'est ce qui permet à
  // SignupScreen d'enchaîner sur ConsentScreen alors que le token existe déjà.
  const signedIn = Boolean(token) && hasRequiredConsent(consent);

  return (
    <NavigationContainer theme={theme}>
      {signedIn ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Diagnostic" component={DiagnosticScreen} />
          <AppStack.Screen name="Strategy" component={StrategyScreen} />
          <AppStack.Screen name="Relation" component={RelationScreen} />
          <AppStack.Screen name="Chat" component={ChatScreen} />
          <AppStack.Screen name="Payment" component={PaymentScreen} />
          <AppStack.Screen name="Offers" component={OffersScreen} />
          <AppStack.Screen name="Library" component={LibraryScreen} />
          <AppStack.Screen name="Tracking" component={TrackingScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Signup" component={SignupScreen} />
          <AuthStack.Screen name="Consent" component={ConsentScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
