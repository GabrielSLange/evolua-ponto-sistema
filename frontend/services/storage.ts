import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Define os dados que queremos salvar
type AuthData = {
   token: string;
   refreshToken: string;
   role: string;
   id: string;
};

// Função para salvar os dados de autenticação
export const saveAuthData = async (data: AuthData) => {
   if (Platform.OS === 'web') {
      // Na web, usamos localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authRefreshToken', data.refreshToken);
      localStorage.setItem('authRole', data.role);
      localStorage.setItem('userId', data.id);
   } else {
      // No mobile, usamos SecureStore
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('authRefreshToken', data.refreshToken);
      await SecureStore.setItemAsync('authRole', data.role);
      await SecureStore.setItemAsync('UserId', data.id);
   }
};

// Função para carregar os dados de autenticação
export const loadAuthData = async (): Promise<AuthData | null> => {
   if (Platform.OS === 'web') {
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('authRefreshToken');
      const role = localStorage.getItem('authRole');
      const id = localStorage.getItem('userId') || '';
      return token && refreshToken && role ? { token, refreshToken, role, id } : null;
   } else {
      const token = await SecureStore.getItemAsync('authToken');
      const refreshToken = await SecureStore.getItemAsync('authRefreshToken');
      const role = await SecureStore.getItemAsync('authRole');
      const id = await SecureStore.getItemAsync('userId') || '';
      return token && refreshToken && role ? { token, refreshToken, role, id } : null;
   }
};

// Função para limpar os dados de autenticação
export const clearAuthData = async () => {
   if (Platform.OS === 'web') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authRefreshToken');
      localStorage.removeItem('authRole');
      localStorage.removeItem('userId');
   } else {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('authRefreshToken');
      await SecureStore.deleteItemAsync('authRole');
      await SecureStore.deleteItemAsync('userId');
   }
};