import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import ScreenContainer from '../../components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';

const LoginScreen = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const { signIn } = useAuth();
   const theme = useTheme(); // Pega o tema

   // Chama a nossa "fábrica" para criar os estilos com base no tema atual
   const styles = getStyles(theme);

   const handleLogin = async () => {
      setLoading(true);
      setError('');
      try {
         await signIn(email, password);
      } catch (err: any) {
         setError(err.message || 'Erro ao tentar fazer login.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <ScreenContainer>
         <View style={styles.formContainer}>
            {/* Agora podemos usar o estilo diretamente, sem o array */}
            <Text variant="headlineMedium" style={styles.title}>
               Evolua Ponto
            </Text>
            <TextInput
               label="Email"
               value={email}
               onChangeText={setEmail}
               style={styles.input}
               keyboardType="email-address"
               autoCapitalize="none"
            />
            <TextInput
               label="Senha"
               value={password}
               onChangeText={setPassword}
               secureTextEntry
               style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
               mode="contained"
               onPress={handleLogin}
               loading={loading}
               disabled={loading}
               style={styles.button}
            >
               Entrar
            </Button>
            <Modal
               transparent={true}
               animationType="fade"
               visible={loading}
            >
               <View style={styles.loaderOverlay}>
                  <CustomLoader />
               </View>
            </Modal>
         </View>
      </ScreenContainer>
   );
};

// NOVO: A "Fábrica de Estilos"
// É uma função que fica fora do componente e retorna o StyleSheet.create
const getStyles = (theme: any) =>
   StyleSheet.create({
      formContainer: {
         flex: 1,
         justifyContent: 'center',
         padding: 20,
         maxWidth: 400,
         alignSelf: 'center',
         width: '100%',
      },
      title: {
         textAlign: 'center',
         marginBottom: 24,
         // Agora podemos usar o tema aqui dentro!
         color: theme.colors.primary,
      },
      input: {
         marginBottom: 16,
      },
      button: {
         marginTop: 8,
      },
      error: {
         // Podemos até usar as cores do tema para o erro
         color: theme.colors.error,
         textAlign: 'center',
         marginBottom: 12,
      },
      loaderOverlay: {
         flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
         backgroundColor: 'rgba(0, 0, 0, 0.3)',
         alignItems: 'center',
         justifyContent: 'center',
      },
   });

export default LoginScreen;