import { useState, useCallback } from "react";
import api from "../../services/api";
import { ModelFuncionario } from "../../models/ModelFuncionario";
import { useFocusEffect, useRouter } from "expo-router";
import { useNotification } from "@/contexts/NotificationContext";
import { ModelEstabelecimento } from "@/models/ModelEstabelecimento";
import { useAuth } from '../../contexts/AuthContext';

export interface DropdownItem {
   label: string;
   value: string;
}

// Controller para a lógica de funcionários
export const useFuncionarios = (estabelecimentoId: string | undefined) => {
    const [funcionarios, setFuncionarios] = useState<ModelFuncionario[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFuncionarios = useCallback(() => {
        // Só busca os dados se tivermos um ID de Empresa
        if (!estabelecimentoId) return;

        setLoading(true);
        api.get(`/Funcionarios/estabelecimento/${estabelecimentoId}`)
            .then(response => {
                if (response.data && response.data) {
                    setFuncionarios(response.data);
                }
            })
            .catch(error => {
                console.error("Erro ao buscar funcionários:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [estabelecimentoId]);

    const toggleFuncionarioAtivo = async (funcionarioId: string) => {
        const originalFuncionarios = [...funcionarios];

        setFuncionarios(funcionarios =>
            funcionarios.map(funcionario =>
                funcionario.id === funcionarioId ? { ...funcionario, ativo: !funcionario.ativo } : funcionario
            )
        );

        try {
            await api.patch(`/funcionarios?Id=${funcionarioId}`);
        } catch (error) {
            console.error("Erro ao atualizar status do funcionário:", error);
            setFuncionarios(originalFuncionarios);
        }
    };

    useFocusEffect(fetchFuncionarios);

    return { funcionarios, loading, fetchFuncionarios, toggleFuncionarioAtivo };
}

// Controller para adicionar um novo funcionário
export const useAddFuncionario = (estabelecimentoId: string) => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showNotification } = useNotification();
    const { role } = useAuth();
    const [escalas, setEscalas] = useState<DropdownItem[]>([]);

    const fetchEscalas = useCallback(async () => {
      if (!estabelecimentoId) return;
      try {
         // Busca detalhes do estabalecimento para pegar a empresa
         const estabelciemntoResp = await api.get(`/estabelecimento/Id?estabelecimentoId=${estabelecimentoId}`);
         const empresaId = estabelciemntoResp.data?.empresaId;

         if (empresaId) {
            // Busca as escalas da empresa
            const escalasResp = await api.get(`/Escalas?empresaId=${empresaId}`);
            const opcoes = escalasResp.data.map((e: any) => ({
               label: `${e.nome} (${e.cargaHorariaSemanal}h)`,
               value: e.id
            }));
            setEscalas(opcoes);
         }
      }
      catch (error) {
         console.error(error);
         showNotification('Erro ao carregar escalas.', 'error');
      }
   }, [estabelecimentoId]);

   useFocusEffect(
      useCallback(() => {
         fetchEscalas();
      }, [])
   );

    const addFuncionario = async (funcionario: ModelFuncionario) => {

        try {
            setLoading(true);
            funcionario.id = null;
            funcionario.estabelecimentoId = estabelecimentoId;
            await api.post('/funcionarios', { ...funcionario });
            showNotification('Funcionário cadastrado com sucesso!', 'success');
            router.replace({
                pathname: `/(${role})/funcionarios`,
                params: { estabelecimentoId: estabelecimentoId }
            });
        } catch (error) {
            console.error("Erro ao cadastrar funcionário:", error);
            showNotification('Erro ao cadastrar funcionário.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { loading, addFuncionario, escalas };
};

// Controller para editar um funcionário existente
export const useEditFuncionario = (funcionarioId: string | undefined, estabelecimentoId: string) => {
    const [loading, setLoading] = useState(false);
    const [funcionario, setFuncionario] = useState<ModelFuncionario>();
    const [estabelecimentos, setEstabelecimentos] = useState<ModelEstabelecimento[]>([]);
    const router = useRouter();
    const { showNotification } = useNotification();
    const [escalas, setEscalas] = useState<DropdownItem[]>([]);

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
                    value: String(e.id || e.Id) // Aceita tanto id quanto Id e força string
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
            router.replace({
                pathname: '/(superadmin)/funcionarios',
                params: { estabelecimentoId: estabelecimentoId }
            });
        } catch (error) {
            showNotification('Erro ao atualizar funcionário.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { loading, funcionario, estabelecimentos, escalas, updateFuncionario };
};