import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

const InitialLayout = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Se ainda estamos carregando, não faça nada

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && !inAuthGroup) {
      // Se está autenticado e fora de um grupo protegido,
      // redirecione para o painel correto.
      if (role === 'superadmin') {
        router.replace('/(superadmin)');
      } else if (role === 'admin') {
        router.replace('/(admin)');
      } else if (role === 'normal') {
        router.replace('/(employee)');
      }
    } else if (!isAuthenticated) {
      // Se não está autenticado, force para a tela de login.
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, role, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <InitialLayout />
      </PaperProvider>
    </AuthProvider>
  );
}