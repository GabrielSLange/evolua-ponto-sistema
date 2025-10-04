import { useState, useCallback, useEffect } from 'react';
import { router, useFocusEffect, useRouter } from 'expo-router';
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
export const useAddEstabelecimento = (empresaId: string, empresaNome: string) => {
   const [loading, setLoading] = useState(false);
   const [estabelecimento] = useState<ModelEstabelecimento>();
   const router = useRouter();
   const { showNotification } = useNotification();

   const addEstabelecimento = async (estabelecimento: ModelEstabelecimento) => { // Use 'any' por enquanto, criar         estabelecimento.empresaId = String(empresaId);
      try {
         setLoading(true);
         estabelecimento.id = undefined;
         estabelecimento.empresaId = String(empresaId);
         await api.post('/Estabelecimento', { ...estabelecimento });
         showNotification('Estabelecimento cadastrado com sucesso!', 'success');
         router.push(`/estabelecimentos?empresaId=${empresaId}&empresaNome=${empresaNome}`);
      } catch (error) {
         console.error("Erro ao cadastrar estabelecimento:", error);
         showNotification('Erro ao cadastrar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, addEstabelecimento, estabelecimento };
};

// Controller para editar um estabelecimento existente
export const useEditEstabelecimento = (estabelecimentoId: string | undefined, empresaId: string, empresaNome: string) => {
   const [loading, setLoading] = useState(false);
   const [estabelecimento, setEstabelecimento] = useState<ModelEstabelecimento>();
   const router = useRouter();
   const { showNotification } = useNotification();

   const carregarDadosEstabelecimento = useCallback(() => {
      if (estabelecimentoId) {
         setLoading(true);

         api.get(`/estabelecimento/Id?estabelecimentoId=${estabelecimentoId}`)
            .then(response => {
               if (response.data && response.data) {
                  setEstabelecimento(response.data);
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
   }, [estabelecimentoId]);

   useFocusEffect(carregarDadosEstabelecimento);

   const updateEstabelecimento = async (estabelecimento: ModelEstabelecimento) => {
      setLoading(true);
      try {
         await api.put('/estabelecimento', estabelecimento);
         showNotification('Estabelecimento atualizado com sucesso!', 'success');
         router.push(`/estabelecimentos?empresaId=${empresaId}&empresaNome=${empresaNome}`);
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, estabelecimento, updateEstabelecimento };
};