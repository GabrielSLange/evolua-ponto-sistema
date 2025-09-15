import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import api from '../../services/api';
import { ModelEstabelecimento } from '../../models/ModelEstabelecimento';
import { useNotification } from '@/contexts/NotificationContext';

// Controller para a lógica de estabelecimentos
export const useEstabelecimentos = (empresaId: string | undefined) => {
   const [estabelecimentos, setEstabelecimentos] = useState<ModelEstabelecimento[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchEstabelecimentos = useCallback(() => {
      // Só busca os dados se tivermos um ID de empresa
      if (!empresaId) return;

      setLoading(true);
      // O endpoint deve corresponder ao que está na sua API
      api.get(`/estabelecimento?empresaId=${empresaId}`)
         .then(response => {
            if (response.data && response.data) {
               setEstabelecimentos(response.data);
            }
         })
         .catch(error => {
            console.error("Erro ao buscar estabelecimentos:", error);
         })
         .finally(() => {
            setLoading(false);
         });
   }, [empresaId]); // Re-executa se o empresaId mudar

   const toggleEstabelecimentoAtivo = async (estabelecimentoId: string) => {
      const originalEstabelecimentos = [...estabelecimentos];

      setEstabelecimentos(estabelecimentos =>
         estabelecimentos.map(estabelecimento =>
            estabelecimento.id === estabelecimentoId ? { ...estabelecimento, ativo: !estabelecimento.ativo } : estabelecimento
         )
      );

      try {
         await api.patch(`/Estabelecimento?Id=${estabelecimentoId}`);
      }
      catch (error) {
         console.error("Erro ao atualizar status do estabelecimento:", error);
         setEstabelecimentos(originalEstabelecimentos);
      }

   };

   useFocusEffect(fetchEstabelecimentos);

   return { estabelecimentos, loading, fetchEstabelecimentos, toggleEstabelecimentoAtivo };
};

// Controller para adicionar um novo estabelecimento
export const useAddEstabelecimento = () => {
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { showNotification } = useNotification();

   const addEstabelecimento = async (data: ModelEstabelecimento) => { // Use 'any' por enquanto, criaremos a interface depois
      setLoading(true);
      try {
         await api.post('/estabelecimento', data);
         showNotification('Estabelecimento cadastrado com sucesso!', 'success');
         router.back();
      } catch (error) {
         showNotification('Erro ao cadastrar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, addEstabelecimento };
};

// Controller para editar um estabelecimento existente
export const useEditEstabelecimento = (estabelecumentoId: string | undefined) => {
   const [loading, setLoading] = useState(false);
   const [initialData, setInitialData] = useState<any>();
   const router = useRouter();
   const { showNotification } = useNotification();

   useEffect(() => {
      if (estabelecumentoId) {
         setLoading(true);
         api.get(`/estabelecimento/Id?estabelecimentoId=${estabelecumentoId}`)
            .then(response => {
               if (response.data && response.data) {
                  setInitialData(response.data);
               }
            })
            .catch(error => {
               console.error("Erro ao buscar dados do estabelecimento:", error);
               showNotification('Erro ao carregar dados do estabelecimento.', 'error');
            })
            .finally(() => {
               setLoading(false);
            });
      }
   }, [estabelecumentoId]);

   const updateEstabelecimento = async (data: any) => {
      setLoading(true);
      try {
         await api.put('/estabelecimento', data);
         showNotification('Estabelecimento atualizado com sucesso!', 'success');
         router.back();
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, initialData, updateEstabelecimento };
};