import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Animated, Easing, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, Icon } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import ScreenContainer from '../../components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';
import { useNotification } from '@/contexts/NotificationContext';

const LoginScreen = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false); // NOVO: Controle do "olhinho" da senha
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   
   const { signIn } = useAuth();
   const theme = useTheme(); 
   const { showNotification } = useNotification();

   const styles = getStyles(theme);

   // NOVO: Animações de entrada (Fade In e Deslizar para cima)
   const fadeAnim = useRef(new Animated.Value(0)).current;
   const slideAnim = useRef(new Animated.Value(50)).current;

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

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
         const styleId = 'chrome-autofill-fix';
         let styleEl = document.getElementById(styleId);
         
         if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
         }
         
         // Injeta um CSS forçando uma sombra interna com a mesma cor do seu "Surface"
         // e forçando a cor do texto para não sumir.
         styleEl.textContent = `
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 50px ${theme.colors.surface} inset !important;
                -webkit-text-fill-color: ${theme.colors.onSurface} !important;
                background-clip: content-box !important;
            }
         `;
      }
   }, [fadeAnim, slideAnim, theme]); // Adicionei o theme nas dependências

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
      <ScreenContainer>
         {/* KeyboardAvoidingView evita que o teclado cubra o botão de login em telas pequenas */}
         <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
         >
            <View style={styles.containerBox}>
               <Animated.View 
                  style={[
                     styles.formContainer, 
                     { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                  ]}
               >
                  {/* Surface cria um "cartão" com sombra e fundo que se destaca */}
                  <Surface style={styles.surfaceCard} elevation={3}>
                     
                     {/* Ícone representando a logo */}
                     <View style={styles.logoContainer}>
                        <Icon source="clock-check-outline" size={64} color={theme.colors.primary} />
                     </View>

                     <Text variant="headlineMedium" style={styles.title}>
                        Evolua Ponto
                     </Text>
                     
                     <Text variant="bodyMedium" style={styles.subtitle}>
                        Acesse sua conta para continuar
                     </Text>

                     <TextInput
                        mode="outlined" // Modo com borda circular
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
                        // Ícone clicável para ver/ocultar senha
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
                        contentStyle={styles.buttonContent} // Deixa o botão mais "gordinho" e confortável de clicar
                     >
                        Entrar
                     </Button>
                  </Surface>
               </Animated.View>
            </View>
         </KeyboardAvoidingView>

         <Modal
            transparent={true}
            animationType="fade"
            visible={loading}
         >
            <View style={styles.loaderOverlay}>
               <CustomLoader />
            </View>
         </Modal>
      </ScreenContainer>
   );
};

// A "Fábrica de Estilos"
const getStyles = (theme: any) =>
   StyleSheet.create({
      containerBox: {
         flex: 1,
         justifyContent: 'center',
         padding: 16,
      },
      formContainer: {
         maxWidth: 400,
         width: '100%',
         alignSelf: 'center',
      },
      surfaceCard: {
         padding: 24,
         borderRadius: 24, // Bordas bem arredondadas (Material Design 3)
         backgroundColor: theme.colors.surface,
      },
      logoContainer: {
         alignItems: 'center',
         marginBottom: 16,
         // Circulo sutil em volta do logo
         backgroundColor: theme.colors.primaryContainer,
         alignSelf: 'center',
         padding: 16,
         borderRadius: 50,
      },
      title: {
         textAlign: 'center',
         fontWeight: 'bold',
         color: theme.colors.primary,
         marginBottom: 4,
      },
      subtitle: {
         textAlign: 'center',
         color: theme.colors.onSurfaceVariant,
         marginBottom: 24,
      },
      input: {
         marginBottom: 16,
         backgroundColor: 'transparent',
      },
      button: {
         marginTop: 8,
         borderRadius: 12,
      },
      buttonContent: {
         paddingVertical: 6, // Deixa o botão mais alto
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