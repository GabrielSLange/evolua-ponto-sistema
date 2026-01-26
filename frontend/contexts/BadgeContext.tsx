import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext'; // Supondo que tenha auth

interface BadgeContextData {
  pendingCount: number;
  refreshBadges: () => Promise<void>;
}

const BadgeContext = createContext<BadgeContextData>({} as BadgeContextData);

export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const { isAuthenticated, role } = useAuth(); // Só busca se estiver logado

  const refreshBadges = useCallback(async () => {
    if (!isAuthenticated) return;

    if(role === 'admin' || role === 'superadmin') {
      try {
        const response = await api.get('/RegistroPonto/pendentes/contagem');
        if (response.data.success) {
          setPendingCount(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar badges:', error);
        // Não precisa alertar erro aqui para não irritar o usuário, falha silenciosa é melhor em badge
      }
    }
    else{
      setPendingCount(0); // Usuários normais não têm badges
    }
  }, [isAuthenticated]);

  // Atualiza ao montar e a cada 60 segundos (Polling simples)
  useEffect(() => {
    if (isAuthenticated) {
      refreshBadges();
      const interval = setInterval(refreshBadges, 60000); // 60 segundos
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshBadges]);

  return (
    <BadgeContext.Provider value={{ pendingCount, refreshBadges }}>
      {children}
    </BadgeContext.Provider>
  );
};

export function useBadge() {
  return useContext(BadgeContext);
}