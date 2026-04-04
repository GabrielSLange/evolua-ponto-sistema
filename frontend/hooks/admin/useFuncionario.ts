import { useState, useCallback, use } from "react";
import api from "../../services/api";
import { ModelFuncionario } from "../../models/ModelFuncionario";
import { useFocusEffect, useRouter } from "expo-router";
import { useNotification } from "@/contexts/NotificationContext";
import { ModelEstabelecimento } from "@/models/ModelEstabelecimento";

export interface DropdownItem {
   label: string;
   value: string;
}

// Hook para listar funcionários de um estabelecimento
export const useFuncionarios = (estabelecimentoId: string | undefined) => {
   const [funcionarios, setFuncionarios] = useState<ModelFuncionario[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchFuncionarios = useCallback(async () => {
      if (!estabelecimentoId) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
         const response = await api.get(`/Funcionarios/estabelecimento/${estabelecimentoId}`)
            .then(response => {
               if (response.data && response.data) {
                  setFuncionarios(response.data);
               }
            });
      } catch (error) {
         console.error("Erro ao buscar funcionários:", error);
      } finally {
         setLoading(false);
      }
   }, [estabelecimentoId]);

   const toggleFuncionarioAtivo = async (funcionarioId: string) => {
      const originalFuncionarios = [...funcionarios];

      setFuncionarios(funcionarios =>
         funcionarios.map(funcionario =>
            funcionario.id === funcionarioId ? { ...funcionario, ativo: !funcionario.ativo } : funcionario
         )
      );

      try {
         await api.patch(`/Funcionarios?Id=${funcionarioId}`);
      } catch (error) {
         console.error("Erro ao atualizar status do funcionário:", error);
         setFuncionarios(originalFuncionarios);
      }
   };

   useFocusEffect(
      useCallback(() => {
         fetchFuncionarios();
      }, [fetchFuncionarios])
   );

   return { funcionarios, loading, fetchFuncionarios, toggleFuncionarioAtivo };
};

// Hook para listar TODOS os funcionários de uma empresa (usado pela tela Todos os Funcionários)
export const useTodosFuncionarios = (userId: string | null) => {
   const [funcionarios, setFuncionarios] = useState<ModelFuncionario[]>([]);
   const [loading, setLoading] = useState(true);
   const [empresaId, setEmpresaId] = useState<string | undefined>(undefined);

   const fetchTodosFuncionarios = useCallback(async () => {
      if (!userId) {
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
         // 1. Pega empresaId usando o userId do Admin
         const responseFuncionario = await api.get(`Funcionarios/id?funcionarioId=${userId}`);
         const idEmpresa = responseFuncionario.data?.estabelecimento?.empresaId;
         
         setEmpresaId(idEmpresa);

         if (!idEmpresa) {
            setFuncionarios([]);
            return;
         }

         // 2. Busca todos os funcionários da empresa
         const response = await api.get(`/Funcionarios?empresaId=${idEmpresa}`);
         if (response.data) {
            setFuncionarios(response.data);
         }
      } catch (error) {
         console.error("Erro ao buscar todos os funcionários:", error);
      } finally {
         setLoading(false);
      }
   }, [userId]);

   const toggleFuncionarioAtivo = async (funcionarioId: string) => {
      const originalFuncionarios = [...funcionarios];

      setFuncionarios(funcionarios =>
         funcionarios.map(funcionario =>
            funcionario.id === funcionarioId ? { ...funcionario, ativo: !funcionario.ativo } : funcionario
         )
      );

      try {
         await api.patch(`/Funcionarios?Id=${funcionarioId}`);
      } catch (error) {
         console.error("Erro ao atualizar status do funcionário:", error);
         setFuncionarios(originalFuncionarios);
      }
   };

   useFocusEffect(
      useCallback(() => {
         fetchTodosFuncionarios();
      }, [fetchTodosFuncionarios])
   );

   return { funcionarios, loading, empresaId, fetchTodosFuncionarios, toggleFuncionarioAtivo };
};

// Hook para adicionar um novo funcionário
export const useAddFuncionario = (estabelecimentoId: string | undefined, empresaIdParam: string | undefined) => {
   const [loading, setLoading] = useState(false);
   const [escalas, setEscalas] = useState<DropdownItem[]>([]);
   const [estabelecimentos, setEstabelecimentos] = useState<ModelEstabelecimento[]>([]);
   const router = useRouter();
   const { showNotification } = useNotification();

   const fetchDadosIniciais = useCallback(async () => {
      try {
         let localEmpresaId = empresaIdParam;

         if (estabelecimentoId && !localEmpresaId) {
            // Busca detalhes do estabalecimento para pegar a empresa
            const estabelcimentoResp = await api.get(`/estabelecimento/Id?estabelecimentoId=${estabelecimentoId}`);
            localEmpresaId = estabelcimentoResp.data?.empresaId;
         }

         if (localEmpresaId) {
            // Busca as escalas da empresa
            const escalasResp = await api.get(`/Escalas?empresaId=${localEmpresaId}`);
            const opcoes = escalasResp.data.map((e: any) => ({
               label: `${e.nome} (${e.cargaHorariaSemanal}h)`,
               value: e.id
            }));
            setEscalas(opcoes);

            // Busca os estabelecimentos para o dropdown, caso selecione de Todos os Funcionários
            const estabResp = await api.get(`/estabelecimento?empresaId=${localEmpresaId}`);
            if (estabResp.data) {
               setEstabelecimentos(estabResp.data);
            }
         }
      }
      catch (error) {
         console.error(error);
         showNotification('Erro ao carregar dados iniciais.', 'error');
      }
   }, [estabelecimentoId, empresaIdParam]);

   useFocusEffect(
      useCallback(() => {
         fetchDadosIniciais();
      }, [fetchDadosIniciais])
   );

   const addFuncionario = async (funcionario: ModelFuncionario) => {
      setLoading(true);
      try {
         funcionario.id = null;
         if (estabelecimentoId) {
             funcionario.estabelecimentoId = estabelecimentoId;
         }
         await api.post('/funcionarios', funcionario);
         showNotification('Funcionário cadastrado com sucesso!', 'success');
         if (estabelecimentoId) {
            router.replace({
               pathname: '/(admin)/funcionarios',
               params: { estabelecimentoId: estabelecimentoId }
            });
         } else {
            router.replace('/(admin)/todos-funcionarios');
         }
      } catch (error) {
         console.error("Erro ao cadastrar funcionário:", error);
         showNotification('Erro ao cadastrar funcionário.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, addFuncionario, escalas, estabelecimentos };
};

// Hook para editar um funcionário
export const useEditFuncionario = (funcionarioId: string | undefined, estabelecimentoId: string) => {
   const [loading, setLoading] = useState(false);
   const [funcionario, setFuncionario] = useState<ModelFuncionario>();
   const [estabelecimentos, setEstabelecimentos] = useState<ModelEstabelecimento[]>([]);
   const [escalas, setEscalas] = useState<DropdownItem[]>([]);
   const router = useRouter();
   const { showNotification } = useNotification();

   const carregarDadosFuncionario = useCallback(async () => {
      if (funcionarioId) {
         setLoading(true);
         try {
            // 1. Busca os dados do funcionário
            const responseFuncionario = await api.get(`/funcionarios/Id?funcionarioId=${funcionarioId}`);
            const dadosFuncionario = responseFuncionario.data;

            if (dadosFuncionario) {
               setFuncionario(dadosFuncionario);

               // 2. Extrai o empresaId do estabelecimento do funcionário
               const empresaId = dadosFuncionario.estabelecimento?.empresaId;

               if (empresaId) {
                  // 3. Busca todos os estabelecimentos daquela empresa
                  const responseEstabelecimentos = await api.get(`/estabelecimento?empresaId=${empresaId}`);
                  setEstabelecimentos(responseEstabelecimentos.data || []);

                  // 4. Busca Escalas
                  const responseEscalas = await api.get(`/Escalas?empresaId=${empresaId}`);
                  const opcoesEscalas = responseEscalas.data.map((e: any) => ({
                     label: `${e.nome} (${e.cargaHorariaSemanal}h)`,
                     value: e.id
                  }));
                  setEscalas(opcoesEscalas);
               }
            }
         } catch (error) {
            console.error("Erro ao buscar dados do funcionário ou estabelecimentos:", error);
            showNotification('Erro ao carregar dados para edição.', 'error');
         } finally {
            setLoading(false);
         }
      }
   }, [funcionarioId]);

   useFocusEffect(useCallback(() => { carregarDadosFuncionario(); }, [carregarDadosFuncionario]));

   const updateFuncionario = async (funcionario: ModelFuncionario) => {
      setLoading(true);
      try {
         await api.put('/funcionarios', funcionario);
         showNotification('Funcionário atualizado com sucesso!', 'success');
         if (estabelecimentoId) {
            router.push({
               pathname: '/(admin)/funcionarios',
               params: { estabelecimentoId: estabelecimentoId }
            });
         } else {
            router.push('/(admin)/todos-funcionarios');
         }
      } catch (error) {
         showNotification('Erro ao atualizar funcionário.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return { loading, funcionario, estabelecimentos, escalas, updateFuncionario };
};
