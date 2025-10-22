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
import { Text, View, StyleSheet, Modal } from 'react-native';

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
    <View style={styles.snackbarContainer}>
      <Snackbar
        visible={notificationState.visible}
        onDismiss={notificationState.onDismiss}
        duration={4000}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <Text style={styles.snackbarText}>
          {notificationState.message}
        </Text>
      </Snackbar>
    </View>
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

    const inAuthGroup = segments[0] === '(auth)';

    // --- Lógica para usuário NÃO autenticado ---
    if (!isAuthenticated) {
      // Se não está na tela de (auth), redireciona para login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return; // Para a execução
    }

    const currentRouteGroup = segments[0];

    // 1. Se o usuário está em uma rota de (auth) mas já está logado, redireciona
    if (inAuthGroup) {
      if (role === 'superadmin') {
        router.replace('/(superadmin)/empresas');
      } else if (role === 'admin') {
        router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
      } else if (role === 'normal') {
        router.replace('/(employee)/home');
      }
      return;
    }

    // 2. Proteção de Rota por Role
    // Verifica se a rota atual é diferente da permitida para a role
    if (role === 'normal' && currentRouteGroup !== '(employee)') {
      router.replace('/(employee)/home');
    } else if (role === 'admin' && currentRouteGroup !== '(admin)') {
      router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
    } else if (role === 'superadmin' && currentRouteGroup !== '(superadmin)') {
      router.replace('/(superadmin)/empresas');
    }
  }, [isAuthenticated, isLoading, role, segments, userId]);

  <Modal
    transparent={true}
    animationType="fade"
    visible={isLoading}
  >
    <View style={styles.loaderOverlay}>
      <CustomLoader />
    </View>
  </Modal>

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

const styles = StyleSheet.create({
  // ... (outros estilos que você possa ter, como 'center')

  // ADICIONE ESTE ESTILO
  snackbarContainer: {
    // Posiciona o container de forma absoluta
    position: 'absolute',

    // Alinha no topo da tela
    top: 80, // <-- Ajuste essa distância do topo (ex: 50 ou 80)

    // Garante que ocupe toda a largura
    left: 8,
    right: 8,

    // Garante que fique "em cima" de todo o resto
    zIndex: 1000,
  },
  snackbarText: {
    textAlign: 'center', // Centraliza o texto horizontalmente
    color: '#FFFFFF',      // Cor do texto (branco)
    width: '100%',         // Garante que o texto ocupe toda a largura
  },
  loaderOverlay: {
    flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});