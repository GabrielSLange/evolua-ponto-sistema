import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
// A importação agora funcionará, pois o arquivo foi criado
import CustomLoader from '../components/CustomLoader';

const RootLayoutNav = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // **CORREÇÃO:** Redireciona para a tela 'index' dentro de cada grupo
      if (role === 'superadmin') {
        router.replace('/(superadmin)');
      } else if (role === 'admin') {
        router.replace('/(admin)');
      } else { // 'normal'
        router.replace('/(employee)/home');
      }
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, role, segments]);

  if (isLoading) {
    return <CustomLoader />;
  }

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