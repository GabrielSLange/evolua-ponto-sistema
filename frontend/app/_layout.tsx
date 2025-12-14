import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Snackbar } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect, useContext } from 'react';
import CustomLoader from '../components/CustomLoader';
import { NotificationProvider, NotificationStateContext } from '../contexts/NotificationContext';
import { Text, View, StyleSheet } from 'react-native';

// --- IMPORTS PARA A CORREÇÃO DOS ÍCONES ---
import { useFonts } from 'expo-font';
// ------------------------------------------

// Componente GlobalSnackbar (Mantive igual ao seu)
const GlobalSnackbar = () => {
  const notificationState = useContext(NotificationStateContext);

  if (!notificationState) return null;

  const getBackgroundColor = () => {
    switch (notificationState.type) {
      case 'error': return '#B00020';
      case 'success': return '#00C853';
      default: return undefined;
    }
  };

  return (
    <View style={styles.snackbarContainer}>
      <Snackbar
        visible={notificationState.visible}
        onDismiss={notificationState.onDismiss}
        duration={4000}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <Text style={styles.snackbarText}>{notificationState.message}</Text>
      </Snackbar>
    </View>
  );
}

// Componente de Navegação Principal
const RootLayoutNav = () => {
  const { isAuthenticated, isLoading, role, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // --- CORREÇÃO 1: Carregamento Explícito da Fonte ---
  // Mapeamos 'MaterialDesignIcons' (que o Paper usa) direto para o arquivo físico
  const [fontsLoaded] = useFonts({
    // Apontamos direto para a raiz do site (/fonts/...)
    'MaterialDesignIcons': '/fonts/MaterialCommunityIcons.ttf',
  });

  useEffect(() => {
    // Se ainda está carregando Auth ou Fonte, não faz redirecionamento
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Se NÃO está logado
    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Se JÁ está logado
    const currentRouteGroup = segments[0];

    if (inAuthGroup) {
      if (role === 'superadmin') router.replace('/(superadmin)/empresas');
      else if (role === 'admin') router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
      else if (role === 'normal') router.replace('/(employee)/home');
      return;
    }

    // Proteção de Rotas
    if (role === 'normal' && currentRouteGroup !== '(employee)') {
      router.replace('/(employee)/home');
    } else if (role === 'admin' && currentRouteGroup !== '(admin)') {
      router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
    } else if (role === 'superadmin' && currentRouteGroup !== '(superadmin)') {
      router.replace('/(superadmin)/empresas');
    }
  }, [isAuthenticated, isLoading, role, segments, userId, fontsLoaded]);

  // --- CORREÇÃO 2: Proteção contra Tela Branca ---
  // Se estiver carregando (Auth) OU se a fonte não baixou ainda:
  // Mostra APENAS o Loader. Não tenta renderizar o Slot.
  if (isLoading) {
    return (
      <View style={styles.loaderOverlay}>
        <CustomLoader />
      </View>
    );
  }

  // Só renderiza o app quando tudo estiver pronto
  return <Slot />;
};

// Componente de Tema
const ThemedApp = () => {
  const { theme } = useAuth();
  const currentTheme = theme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={currentTheme}>
      <RootLayoutNav />
      <GlobalSnackbar />
    </PaperProvider>
  );
}

// Layout Raiz
export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemedApp />
      </NotificationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  snackbarContainer: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  snackbarText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: '#fff', // Fundo sólido ou transparente, como preferir
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    height: '100%', // Garante altura total
    width: '100%',
  },
});