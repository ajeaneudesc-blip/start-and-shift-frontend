import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Réglages pensés pour un réseau instable : on garde les données en
      // cache longtemps et on évite les rechargements automatiques, qui
      // consomment du forfait pour rien.
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export default function App() {
  const restore = useAuthStore((s) => s.restore);

  // Polices de marque. Les noms de famille déclarés ici sont ceux que
  // src/theme/tokens.ts référence : les changer casserait toute la
  // typographie. `error` est ignoré volontairement — une police absente doit
  // dégrader vers la police système, jamais bloquer le démarrage.
  const [fontsLoaded] = useFonts({
    'StartShiftSans-Regular': require('./assets/fonts/StartShiftSans-Regular.otf'),
    'StartShiftSans-Medium': require('./assets/fonts/StartShiftSans-Medium.otf'),
    'StartShiftSans-Bold': require('./assets/fonts/StartShiftSans-Bold.otf'),
    'StartShiftSerif-Medium': require('./assets/fonts/StartShiftSerif-Medium.otf'),
  });

  useEffect(() => {
    void restore();
  }, [restore]);

  // RootNavigator affiche déjà un écran d'attente tant que la session n'est
  // pas relue du disque ; on ne rend rien avant que les polices soient prêtes
  // pour éviter que le texte s'affiche d'abord dans la police système puis
  // saute dans la police de marque.
  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
