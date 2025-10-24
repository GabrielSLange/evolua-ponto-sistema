import { useNotification } from "@/contexts/NotificationContext";
import { ModelEstabelecimento } from "@/models/ModelEstabelecimento";
import api from "@/services/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";

export const useEstabelecimentos = (userId: string | null) => {
   const [estabelecimentos, setEstabelecimentos] = useState<ModelEstabelecimento[]>([]);
   const [loading, setLoading] = useState(true);
   const [nomeEmpresa, setNomeEmpresa] = useState<string>("");
   const [empresaId, setEmpresaId] = useState<string>("");

   const fetchEstabelecimentos = useCallback(async () => {
      // Só busca os dados se tivermos um ID de usuário
      if (!userId) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
         // 1. Busca os dados do funcionário para obter o empresaId
         const responseFuncionario = await api.get(`Funcionarios/id?funcionarioId=${userId}`);

         const idEmpresa = responseFuncionario.data?.estabelecimento?.empresaId

         setEmpresaId(idEmpresa);

         // 2. Verifica se o ID da empresa foi encontrado
         if (!idEmpresa) {
            console.error("ID da empresa não encontrado para o funcionário.");
            setEstabelecimentos([]); // Limpa a lista em caso de erro
            return;
         }

         const responseEmpresa = await api.get(`/Empresas/${idEmpresa}`);
         setNomeEmpresa(responseEmpresa.data?.razaoSocial || "");


         // 3. Busca os estabelecimentos usando o ID da empresa
         const responseEstabelecimentos = await api.get(`/estabelecimento?empresaId=${idEmpresa}`);
         if (responseEstabelecimentos.data) {
            setEstabelecimentos(responseEstabelecimentos.data);
         }

      } catch (error) {
         console.error("Ocorreu um erro ao buscar os estabelecimentos:", error);
         setEstabelecimentos([]); // Limpa a lista em caso de erro
      } finally {
         setLoading(false);
      }
   }, [userId]);

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

   useFocusEffect(
      useCallback(() => {
         fetchEstabelecimentos();
      }, [fetchEstabelecimentos])
   );

   return { estabelecimentos, loading, empresaId, nomeEmpresa, toggleEstabelecimentoAtivo };
};

export const useAddEstabelecimento = (userId: string, empresaId: string) => {
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
         router.push(`/(admin)/estabelecimentos?userId=${userId}`);
      } catch (error) {
         console.error("Erro ao cadastrar estabelecimento:", error);
         showNotification('Erro ao cadastrar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, addEstabelecimento, estabelecimento };
};

export const useEditEstabelecimento = (estabelecimentoId: string | undefined, userId: string) => {
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
         router.replace({ // Alterado para replace para melhor UX
            pathname: '/(admin)/estabelecimentos',
            params: { userId: userId }
         });
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, estabelecimento, updateEstabelecimento };
};