import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const { signIn } = useAuth();

   const handleLogin = async () => {
      setError('');
      setLoading(true);
      try {
         await signIn(email, password);
         // O redirecionamento será tratado pelo nosso _layout.tsx principal
      } catch (err: any) {
         setError(err.message || 'Erro ao tentar fazer login.');
      } finally {
         setLoading(false);
      }
   };

   return (
      <View style={styles.container}>
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
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
   },
   title: {
      textAlign: 'center',
      marginBottom: 24,
   },
   input: {
      marginBottom: 16,
   },
   button: {
      marginTop: 8,
   },
   error: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 12,
   },
});

export default LoginScreen;