import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Animated, Easing, KeyboardAvoidingView, Platform, useWindowDimensions, Image } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, Icon } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import LottieView from 'lottie-react-native';
import CustomLoader from '@/components/CustomLoader';
import { useNotification } from '@/contexts/NotificationContext';

const OptimizedLottie = React.memo(({ imageStyle }: { imageStyle: any }) => {
   return (
      <LottieView
         source={require('../../assets/images/LoginAnimation.json')}
         autoPlay
         loop
         style={imageStyle}
         renderMode="HARDWARE" // Força o uso da placa de vídeo no celular
      />
   );
});

const LoginScreen = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   
   const { signIn } = useAuth();
   const theme = useTheme(); 
   const { showNotification } = useNotification();
   const { width } = useWindowDimensions();

   // Define se a tela é grande (Desktop/Tablet) ou pequena (Celular)
   const isDesktop = width >= 768;

   const styles = getStyles(theme, isDesktop);

   const fadeAnim = useRef(new Animated.Value(0)).current;
   const slideAnim = useRef(new Animated.Value(30)).current;

   useEffect(() => {
      Animated.parallel([
         Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
         }),
         Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
         })
      ]).start();
   }, [fadeAnim, slideAnim]);

   const handleLogin = async () => {
      setLoading(true);
      setError('');
      try {
         await signIn(email, password);
         showNotification('Login realizado com sucesso!', 'success');
      } catch (err: any) {
         const msg = err.message || 'Erro ao tentar fazer login.';
         showNotification(msg, 'error');
         setError(msg);
      } finally {
         setLoading(false);
      }
   };

   return (
      <KeyboardAvoidingView 
         style={{ flex: 1, backgroundColor: theme.colors.background }} 
         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
         <View style={styles.mainLayout}>
            
            {/* CABEÇALHO AZUL: No PC fica na esquerda, no Celular fica no topo! */}
            <View style={styles.headerContainer}>
               <View style={styles.headerContent}>
                  <Text variant={isDesktop ? "displaySmall" : "headlineMedium"} style={styles.welcomeTitle}>
                     Bem-vindo ao Evolua Ponto
                  </Text>
                  <Text variant="titleMedium" style={styles.welcomeSubtitle}>
                     Gestão de jornada inteligente e descomplicada para a sua empresa.
                  </Text>
                  
                  {/* A imagem continua aparecendo apenas no Desktop para não espremer o teclado no celular */}
                  {isDesktop && (
                     <View style={styles.imageWrapper}>
                        <OptimizedLottie imageStyle={styles.illustrationImage} />
                     </View>
                  )}
               </View>
            </View>

            {/* FORMULÁRIO DE LOGIN */}
            <View style={styles.formSection}>
               <Animated.View 
                  style={[
                     styles.formContainer, 
                     { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                  ]}
               >
                  <Surface style={styles.surfaceCard} elevation={isDesktop ? 0 : 4}>
                     
                     <View style={styles.logoContainer}>
                        <Icon source="clock-check-outline" size={56} color={theme.colors.primary} />
                     </View>

                     <Text variant="headlineMedium" style={styles.title}>
                        Acessar Conta
                     </Text>

                     <TextInput
                        mode="outlined"
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="email-outline" color={theme.colors.primary} />}
                     />
                     
                     <TextInput
                        mode="outlined"
                        label="Senha"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        left={<TextInput.Icon icon="lock-outline" color={theme.colors.primary} />}
                        right={
                           <TextInput.Icon 
                              icon={showPassword ? "eye-off" : "eye"} 
                              onPress={() => setShowPassword(!showPassword)}
                              forceTextInputFocus={false}
                           />
                        }
                     />
                     
                     {error ? <Text style={styles.error}>{error}</Text> : null}
                     
                     <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                        contentStyle={styles.buttonContent}
                     >
                        Entrar
                     </Button>
                  </Surface>
               </Animated.View>
            </View>

         </View>

         <Modal transparent={true} animationType="fade" visible={loading}>
            <View style={styles.loaderOverlay}>
               <CustomLoader />
            </View>
         </Modal>

      </KeyboardAvoidingView>
   );
};

// --- FÁBRICA DE ESTILOS ATUALIZADA ---
const getStyles = (theme: any, isDesktop: boolean) =>
   StyleSheet.create({
      mainLayout: {
         flex: 1,
         flexDirection: isDesktop ? 'row' : 'column',
      },
      
      // --- CABEÇALHO AZUL (Responsivo) ---
      headerContainer: {
         flex: isDesktop ? 1.2 : undefined, 
         // No celular ele terá uma altura fixa para abrigar o texto e fazer a curva
         minHeight: isDesktop ? '100%' : 280, 
         backgroundColor: theme.colors.primary, 
         justifyContent: 'center',
         alignItems: 'center',
         padding: 40,
         paddingTop: isDesktop ? 40 : 60, // Dá espaço para a barra de status do celular
         
         // A MÁGICA DA CURVA RESPONSIVA:
         // Se for Desktop, arredonda só a direita. Se for Celular, arredonda as duas de baixo.
         borderBottomRightRadius: 40,
         borderTopRightRadius: isDesktop ? 40 : 0,
         borderBottomLeftRadius: isDesktop ? 0 : 40,
      },
      headerContent: {
         maxWidth: 600,
         alignItems: 'center',
      },
      welcomeTitle: {
         color: '#FFFFFF', 
         fontWeight: 'bold',
         textAlign: 'center',
         marginBottom: 16,
      },
      welcomeSubtitle: {
         color: 'rgba(255, 255, 255, 0.8)',
         textAlign: 'center',
         marginBottom: isDesktop ? 40 : 10, // Menos margem no celular para não empurrar muito
      },
      
      // --- MOLDURA DA IMAGEM (Apenas Desktop) ---
      imageWrapper: {
         width: '80%',
         maxWidth: 320,
         aspectRatio: 1, 
         backgroundColor: '#FFFFFF', 
         borderRadius: 32, 
         overflow: 'hidden', 
         elevation: 8, 
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 4 },
         shadowOpacity: 0.2,
         shadowRadius: 10,
      },
      illustrationImage: {
         width: '100%',
         height: '100%', 
      },

      // --- FORMULÁRIO ---
      formSection: {
         flex: 1,
         // No PC centraliza, no celular joga pro topo para podermos "puxar" ele pra cima
         justifyContent: isDesktop ? 'center' : 'flex-start',
         padding: 20,
         // O EFEITO DE SOBREPOSIÇÃO NO CELULAR: Puxa o formulário para cima do azul!
         marginTop: isDesktop ? 0 : -60, 
      },
      formContainer: {
         maxWidth: 400,
         width: '100%',
         alignSelf: 'center',
      },
      surfaceCard: {
         padding: 32,
         borderRadius: 24,
         backgroundColor: theme.colors.surface,
         // Sombrinha leve no celular para destacar a sobreposição
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 4 },
         shadowOpacity: 0.1,
         shadowRadius: 8,
      },
      logoContainer: {
         alignItems: 'center',
         marginBottom: 16,
         backgroundColor: theme.colors.primaryContainer,
         alignSelf: 'center',
         padding: 16,
         borderRadius: 50,
      },
      title: {
         textAlign: 'center',
         fontWeight: 'bold',
         color: theme.colors.primary,
         marginBottom: 32,
      },
      input: {
         marginBottom: 16,
         backgroundColor: 'transparent',
      },
      button: {
         marginTop: 16,
         borderRadius: 12,
      },
      buttonContent: {
         paddingVertical: 8,
      },
      error: {
         color: theme.colors.error,
         textAlign: 'center',
         marginBottom: 12,
         fontWeight: 'bold',
      },
      loaderOverlay: {
         flex: 1, 
         backgroundColor: 'rgba(0, 0, 0, 0.4)',
         alignItems: 'center',
         justifyContent: 'center',
      },
   });

export default LoginScreen;