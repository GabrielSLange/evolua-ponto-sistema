import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

// --- NOVOS TIPOS PARA MAPEAMENTO DA RESPOSTA DA API ---
interface UserData {
   id: string;
   email: string;
   app_metadata: {
      role: 'superadmin' | 'admin' | 'normal';
   };
}

interface TokenResponse {
   accessToken: string;
   refreshToken: string;
   user: UserData;
}

// --- FIM DOS NOVOS TIPOS ---

// Define a estrutura do nosso contexto
interface AuthContextData {
   token: string | null;
   isAuthenticated: boolean;
   role: 'superadmin' | 'admin' | 'normal' | null;
   isLoading: boolean;
   signIn: (email: string, password: string) => Promise<void>;
   signOut: () => void;
}

// Cria o Contexto com um valor padrão
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Cria o Provedor do Contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [token, setToken] = useState<string | null>(null);
   const [role, setRole] = useState<'superadmin' | 'admin' | 'normal' | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Efeito que roda uma vez quando o app inicia para carregar o token e o papel
   useEffect(() => {
      async function loadStoragedData() {
         const storedToken = await SecureStore.getItemAsync('authToken');
         const storedRole = await SecureStore.getItemAsync('authRole') as 'superadmin' | 'admin' | 'normal' | null;

         if (storedToken && storedRole) {
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setToken(storedToken);
            setRole(storedRole);
         }
         setIsLoading(false);
      }

      loadStoragedData();
   }, []);

   // **MUDANÇA PRINCIPAL:** Função de login agora chama a API de verdade
   const signIn = async (email: string, password: string) => {
      try {
         // 1. Chama o endpoint de login da nossa API .NET
         const response = await api.post<TokenResponse>('/auth/login', { email, password });

         const { accessToken, refreshToken, user } = response.data;

         // 2. Extrai o papel do usuário do objeto 'user', não mais do token
         const userRole = user.app_metadata.role;

         // 3. Atualiza o estado da aplicação
         setToken(accessToken);
         setRole(userRole);

         // 4. Define o header do axios para todas as futuras requisições
         api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

         // 5. Salva o token de acesso, o token de refresh e o papel de forma segura
         await SecureStore.setItemAsync('authToken', accessToken);
         await SecureStore.setItemAsync('authRefreshToken', refreshToken);
         await SecureStore.setItemAsync('authRole', userRole);

      } catch (error) {
         console.error("Falha no login:", error);
         throw new Error("Email ou senha inválidos.");
      }
   };

   const signOut = async () => {
      // Limpa o estado e o armazenamento seguro
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('authRefreshToken');
      await SecureStore.deleteItemAsync('authRole');

      setToken(null);
      setRole(null);
      delete api.defaults.headers.common['Authorization'];
   };

   // Futuramente, adicionaremos a lógica de renovação de token aqui.

   return (
      <AuthContext.Provider value={{ token, isAuthenticated: !!token, role, isLoading, signIn, signOut }}>
         {children}
      </AuthContext.Provider>
   );
};

// Hook customizado para facilitar o uso do contexto
export function useAuth(): AuthContextData {
   const context = useContext(AuthContext);
   return context;
}