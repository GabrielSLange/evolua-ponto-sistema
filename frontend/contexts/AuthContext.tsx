import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
// 1. Importa nossas novas funções de armazenamento
import { saveAuthData, loadAuthData, clearAuthData } from '../services/storage';

// ... (interfaces TokenResponse, UserData, AuthContextData permanecem as mesmas)
interface UserData {
   id: string; email: string; app_metadata: { role: 'superadmin' | 'admin' | 'normal'; };
}
interface TokenResponse {
   accessToken: string; refreshToken: string; user: UserData;
}
interface AuthContextData {
   token: string | null; isAuthenticated: boolean; role: 'superadmin' | 'admin' | 'normal' | null;
   isLoading: boolean; signIn: (email: string, password: string) => Promise<void>; signOut: () => void;
}


const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [token, setToken] = useState<string | null>(null);
   const [role, setRole] = useState<'superadmin' | 'admin' | 'normal' | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Efeito que roda uma vez quando o app inicia
   useEffect(() => {
      async function loadStoragedData() {
         // 2. Usa nossa nova função para carregar os dados
         const authData = await loadAuthData();

         if (authData) {
            api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
            setToken(authData.token);
            setRole(authData.role as 'superadmin' | 'admin' | 'normal');
         }
         setIsLoading(false);
      }

      loadStoragedData();
   }, []);

   const signIn = async (email: string, password: string) => {
      try {
         const response = await api.post<TokenResponse>('/auth/login', { email, password });
         const { accessToken, refreshToken, user } = response.data;
         const userRole = user.app_metadata.role;

         setToken(accessToken);
         setRole(userRole);
         api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

         // 3. Usa nossa nova função para salvar os dados
         await saveAuthData({
            token: accessToken,
            refreshToken: refreshToken,
            role: userRole,
         });

      } catch (error) {
         console.error("Falha no login:", error);
         throw new Error("Email ou senha inválidos.");
      }
   };

   const signOut = async () => {
      // 4. Usa nossa nova função para limpar os dados
      await clearAuthData();
      setToken(null);
      setRole(null);
      delete api.defaults.headers.common['Authorization'];
   };

   return (
      <AuthContext.Provider value={{ token, isAuthenticated: !!token, role, isLoading, signIn, signOut }}>
         {children}
      </AuthContext.Provider>
   );
};

export function useAuth(): AuthContextData {
   const context = useContext(AuthContext);
   return context;
}