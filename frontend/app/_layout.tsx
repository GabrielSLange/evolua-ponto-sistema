import { Slot, useRouter } from 'expo-router';
// 1. Importe os temas claro e escuro
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import CustomLoader from '../components/CustomLoader';
import { Snackbar } from 'react-native-paper';
import { NotificationProvider, NotificationStateContext } from '../contexts/NotificationContext';
import { useContext } from 'react';
import { useSegments } from 'expo-router';

// NOVO: Componente que renderiza o Snackbar global
const GlobalSnackbar = () => {
  const notificationState = useContext(NotificationStateContext);


  if (!notificationState) return null;

  // Define a cor do snackbar com base no tipo de notificação
  const getBackgroundColor = () => {
    switch (notificationState.type) {
      case 'error':
        return '#B00020'; // Cor de erro do Material Design
      case 'success':
        return '#00C853'; // Cor de sucesso
      default:
        return undefined; // Cor padrão do tema
    }
  };

  return (
    <Snackbar
      visible={notificationState.visible}
      onDismiss={notificationState.onDismiss}
      duration={4000}
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {notificationState.message}
    </Snackbar>
  );
}

// Componente que lida com a lógica de navegação/redirecionamento
const RootLayoutNav = () => {
  const { isAuthenticated, isLoading, role, userId } = useAuth();
  const router = useRouter();

  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (segments.includes('bater-ponto')) return;

    if (isAuthenticated) {
      if (role === 'superadmin') {
        router.replace(`/(superadmin)/empresas`);
      } else if (role === 'admin') {
        router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
      } else if (role === 'normal') {
        router.replace('/(employee)/');
      }
    }
    else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, role]);

  if (isLoading) {
    return <CustomLoader />;
  }

  return <Slot />;
};

// NOVO: Componente que aplica o tema ao aplicativo
const ThemedApp = () => {
  // Pega o estado 'theme' do nosso contexto
  const { theme } = useAuth();

  // Define qual objeto de tema usar com base no estado
  const currentTheme = theme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    // O PaperProvider agora recebe o tema correto e reage às mudanças
    <PaperProvider theme={currentTheme}>

      <RootLayoutNav />
    </PaperProvider>
  );
}

// O layout raiz agora envolve tudo com o AuthProvider e renderiza o ThemedApp
export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemedApp />
        <GlobalSnackbar />
      </NotificationProvider>
    </AuthProvider>
  );
}