import '../constants/ignoreWarnings';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Snackbar, configureFonts } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect, useContext } from 'react';
import CustomLoader from '../components/CustomLoader';
import { NotificationProvider, NotificationStateContext } from '../contexts/NotificationContext';
import { Text, View, StyleSheet, TextInput } from 'react-native';
import { BadgeProvider } from '@/contexts/BadgeContext';

// 1. Importações das Fontes e do Splash Screen
import * as SplashScreen from 'expo-splash-screen';
import { default as any } from '../constants/Colors';
import { 
  useFonts, 
  Nunito_400Regular, 
  Nunito_600SemiBold, 
  Nunito_700Bold 
} from '@expo-google-fonts/nunito';

// 2. Segura a tela de splash nativa para a fonte não "piscar"
SplashScreen.preventAutoHideAsync();

// --- 3. INÍCIO DO TRUQUE DA FONTE GLOBAL ---
// Injeta a família da fonte nativamente em todos os textos
const AnyText = Text as any;
AnyText.defaultProps = AnyText.defaultProps || {};
AnyText.defaultProps.style = { 
  ...(AnyText.defaultProps.style || {}), 
  fontFamily: 'Nunito_400Regular' 
};

const AnyTextInput = TextInput as any;
AnyTextInput.defaultProps = AnyTextInput.defaultProps || {};
AnyTextInput.defaultProps.style = { 
  ...(AnyTextInput.defaultProps.style || {}), 
  fontFamily: 'Nunito_400Regular' 
};
// --- FIM DO TRUQUE ---


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

    if (currentRouteGroup === 'perfil') {
      return; 
    }

    if (inAuthGroup) {
      if (role === 'superadmin') router.replace('/(superadmin)/empresas');
      else if (role === 'admin') router.replace(`/(admin)/meu-ponto/home`);
      else if (role === 'normal') router.replace('/(employee)/meu-ponto/home');
      else if (role === 'fiscal') router.replace('/(fiscal)');
      return;
    }

    if (role === 'normal' && currentRouteGroup !== '(employee)') {
      router.replace('/(employee)/meu-ponto/home');
    } else if (role === 'admin' && currentRouteGroup !== '(admin)') {
      router.replace(`/(admin)/meu-ponto/home`);
    } else if (role === 'superadmin' && currentRouteGroup !== '(superadmin)') {
      router.replace('/(superadmin)/empresas');
    }else if (role === 'fiscal' && currentRouteGroup !== '(fiscal)') {
      router.replace('/(fiscal)');
    }
  }, [isAuthenticated, isLoading, role, segments, userId]);

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
  
  // 1. Criamos a configuração básica da fonte
  const fontConfig = {
    fontFamily: 'Nunito_400Regular',
  };

  // 2. Geramos as fontes do Material Design usando a nossa Nunito
  const customFonts = configureFonts({ config: fontConfig });

  const myCustomColors = {
    primary: '#0088CE',           // <- ESSA É A NOVA COR PRINCIPAL (Substitui o Roxo)
    onPrimary: '#FFFFFF',         // <- Cor do texto/ícone que fica EM CIMA do primary (Geralmente branco)
    primaryContainer: '#D6E4FF',  // <- Uma versão bem clarinha do primary (usado no fundo de alguns botões/ícones)
    onPrimaryContainer: '#001955',// <- Cor do texto que fica EM CIMA do container clarinho
  };

  // 3. Injetamos as fontes geradas no tema atual (Claro ou Escuro)
  const baseTheme = theme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...baseTheme,
    fonts: customFonts,
    colors: {
      ...baseTheme.colors,
      ...myCustomColors, // Injeta as nossas cores por cima do padrão
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <RootLayoutNav />
      <GlobalSnackbar />
    </PaperProvider>
  );
}

export default function RootLayout() {
  // 4. Carregamento das fontes
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // 5. Oculta o Splash Screen quando carregar (ou se der erro de rede)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Enquanto a fonte não carrega, a tela fica travada no Splash nativo
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <BadgeProvider>
          <ThemedApp />
        </BadgeProvider>
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
    // Agora que a fonte global existe, você pode forçar o peso chamando a fonte Bold:
    fontFamily: 'Nunito_700Bold', 
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