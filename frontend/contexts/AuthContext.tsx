import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { saveAuthData, loadAuthData, clearAuthData } from '../services/storage';
import { useColorScheme } from 'react-native';
import { eventBus } from '../services/eventBus';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Nossos tipos de dados ---
interface DecodedToken {
   FuncionarioId: string;
   role: 'superadmin' | 'admin' | 'normal';
}
// **CORREÇÃO:** Alinha os nomes das propriedades com o JSON retornado pela API
interface TokenResponse {
   token: string;
   refresh_token: string;
   nome: string;
   perfil: string;
}
interface AuthContextData {
   token: string | null;
   isAuthenticated: boolean;
   userId: string | null;
   role: 'superadmin' | 'admin' | 'normal' | null;
   isLoading: boolean;
   theme: 'light' | 'dark'; // Propriedade para o tema atual
   toggleTheme: () => void; // Função para alternar o tema
   signIn: (email: string, password: string) => Promise<void>;
   signOut: () => void;
}
// --- Fim dos tipos ---

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [token, setToken] = useState<string | null>(null);
   const [role, setRole] = useState<'superadmin' | 'admin' | 'normal' | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [userId, setUserId] = useState<string | null>(null);

   // **NOVO:** Lógica para gerenciar o tema
   const colorScheme = useColorScheme(); // Pega o tema do OS (light, dark, ou null)
   const [theme, setTheme] = useState<'light' | 'dark'>('light');

   useEffect(() => {
      async function loadThemePreference() {
         try {
            const storedTheme = await AsyncStorage.getItem('@App:theme');
            if (storedTheme) {
                  setTheme(storedTheme as 'light' | 'dark');
            }
         } catch (error) {
            console.log("Erro ao carregar tema:", error);
         }
      }
      loadThemePreference();
   }, []);

   const toggleTheme = async () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme); // Atualiza visualmente na hora
      await AsyncStorage.setItem('@App:theme', newTheme); // Salva na memória
   };

   const signOut = async () => {
      await clearAuthData();
      setToken(null);
      setRole(null);
      setUserId(null);
      delete api.defaults.headers.common['Authorization'];
   };

   useEffect(() => {
      // Define a função que será chamada quando o alarme disparar
      const handleUnauthorized = () => {
         signOut();
      };

      // Adiciona o "ouvinte" ao nosso event bus
      eventBus.on('auth-unauthorized', handleUnauthorized);

      // Função de limpeza: remove o "ouvinte" quando o componente for desmontado
      return () => {
         eventBus.off('auth-unauthorized', handleUnauthorized);
      };
   }, [signOut]);

   useEffect(() => {
      async function loadStoragedData() {
         const authData = await loadAuthData();
         if (authData?.token) {
            const decoded = jwtDecode<DecodedToken>(authData.token);
            const userRole = decoded.role;
            api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
            setUserId(authData.id);
            setToken(authData.token);
            setRole(userRole);
         }
         setIsLoading(false);
      }
      loadStoragedData();
   }, []);

   const signIn = async (login: string, senha: string) => {
      setIsLoading(true);
      try {
         const response = await api.post<TokenResponse>('/auth/login', { login, senha });

         const { token, refresh_token, perfil } = response.data;
         const decoded = jwtDecode<DecodedToken>(token);
         setUserId(decoded.FuncionarioId);

         setToken(token);
         setRole(perfil as 'superadmin' | 'admin' | 'normal');
         api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

         await saveAuthData({
            token: token,
            refreshToken: refresh_token,
            role: perfil as 'superadmin' | 'admin' | 'normal',
            id: decoded.FuncionarioId
         });

      } catch (error) {
         console.error("Falha no login:", error);
         throw new Error("Email ou senha inválidos.");
      }
      finally {
         setIsLoading(false);
      }
   };

   return (
      <AuthContext.Provider value={{ token, isAuthenticated: !!token, userId, role, isLoading, theme, toggleTheme, signIn, signOut }}>
         {children}
      </AuthContext.Provider>
   );
};

export function useAuth(): AuthContextData {
   const context = useContext(AuthContext);
   return context;
}