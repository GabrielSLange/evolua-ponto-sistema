import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Snackbar } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect, useContext } from 'react';
import CustomLoader from '../components/CustomLoader';
import { NotificationProvider, NotificationStateContext } from '../contexts/NotificationContext';
import { Text, View, StyleSheet } from 'react-native';

// SEM useFonts, SEM require. Vida que segue.

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

const RootLayoutNav = () => {
  const { isAuthenticated, isLoading, role, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Lógica de Auth pura
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentRouteGroup = segments[0];

    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (inAuthGroup) {
      if (role === 'superadmin') router.replace('/(superadmin)/empresas');
      else if (role === 'admin') router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
      else if (role === 'normal') router.replace('/(employee)/home');
      return;
    }

    if (role === 'normal' && currentRouteGroup !== '(employee)') {
      router.replace('/(employee)/home');
    } else if (role === 'admin' && currentRouteGroup !== '(admin)') {
      router.replace(`/(admin)/estabelecimentos?userId=${userId}`);
    } else if (role === 'superadmin' && currentRouteGroup !== '(superadmin)') {
      router.replace('/(superadmin)/empresas');
    }
  }, [isAuthenticated, isLoading, role, segments, userId]);

  // Se tiver carregando o AUTH, mostra loader.
  // Se for fonte, problema da fonte. O app abre.
  if (isLoading) {
    return (
      <View style={styles.loaderOverlay}>
        <CustomLoader />
      </View>
    );
  }

  return <Slot />;
};

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
    backgroundColor: '#fff', 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    height: '100%',
    width: '100%',
  },
});