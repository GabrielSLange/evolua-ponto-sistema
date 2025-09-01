import { Slot, useRouter } from 'expo-router';
// 1. Importe os temas claro e escuro
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import CustomLoader from '../components/CustomLoader';

// Componente que lida com a lógica de navegação/redirecionamento
const RootLayoutNav = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      if (role === 'superadmin') {
        router.replace('/(superadmin)');
      } else if (role === 'admin') {
        router.replace('/(admin)');
      } else if (role === 'normal') {
        router.replace('/(employee)/home');
      }
    } else {
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
      <ThemedApp />
    </AuthProvider>
  );
}