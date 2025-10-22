import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { saveAuthData, loadAuthData, clearAuthData } from '../services/storage';
import { useColorScheme } from 'react-native';
import { eventBus } from '../services/eventBus';

// --- Nossos tipos de dados ---
interface DecodedToken {
   sub: string;
   app_metadata: {
      role: 'superadmin' | 'admin' | 'normal';
   };
}
interface UserData {
   id: string;
   email: string;
}
// **CORREÇÃO:** Alinha os nomes das propriedades com o JSON retornado pela API
interface TokenResponse {
   access_token: string;
   refresh_token: string;
   user: UserData;
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
   const [theme, setTheme] = useState<'light' | 'dark'>(colorScheme || 'light');

   const toggleTheme = () => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
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
            const userRole = decoded.app_metadata.role;
            api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
            setUserId(authData.id);
            setToken(authData.token);
            setRole(userRole);
         }
         setIsLoading(false);
      }
      loadStoragedData();
   }, []);

   const signIn = async (email: string, password: string) => {
      setIsLoading(true);
      try {
         const response = await api.post<TokenResponse>('/auth/login', { email, password });

         // **CORREÇÃO:** Usa os nomes corretos (snake_case) para desestruturar a resposta
         const { access_token, refresh_token } = response.data;

         const decoded = jwtDecode<DecodedToken>(access_token);
         const userRole = decoded.app_metadata.role;
         setUserId(decoded.sub);

         setToken(access_token);
         setRole(userRole);
         api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

         await saveAuthData({
            token: access_token,
            refreshToken: refresh_token,
            role: userRole,
            id: decoded.sub
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