import { Slot, useRouter } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import CustomLoader from '../components/CustomLoader';

const RootLayoutNav = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se ainda estiver carregando os dados do token, não fazemos nada.
    if (isLoading) {
      return;
    }

    // LÓGICA DE REDIRECIONAMENTO SIMPLIFICADA E ROBUSTA
    if (isAuthenticated) {
      // Se o usuário ESTÁ AUTENTICADO, garantimos que ele seja enviado
      // para o painel correto, não importa onde ele esteja.
      if (role === 'superadmin') {
        router.replace('/(superadmin)');
      } else if (role === 'admin') {
        router.replace('/(admin)');
      } else if (role === 'normal') {
        router.replace('/(employee)/home');
      }
    } else {
      // Se o usuário NÃO ESTÁ AUTENTICADO, garantimos que ele
      // seja enviado para a tela de login.
      router.replace('/(auth)/login');
    }

  }, [isAuthenticated, isLoading, role]); // A dependência em 'segments' não é mais necessária

  // Se estiver no carregamento inicial, exibe o loader.
  if (isLoading) {
    return <CustomLoader />;
  }

  // Após o carregamento, o Expo Router renderiza a rota correta.
  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <RootLayoutNav />
      </PaperProvider>
    </AuthProvider>
  );
}