import { useState, useCallback } from "react";
import api from "../../services/api";
import { ModelFuncionario } from "../../models/ModelFuncionario";
import { useFocusEffect, useRouter } from "expo-router";
import { useNotification } from "@/contexts/NotificationContext";

// Controller para a lógica de funcionários
export const useFuncionarios = (estabelecimentoId: string | undefined) => {
  const [funcionarios, setFuncionarios] = useState<ModelFuncionario[]>([]);
  const [loading, setLoading] = useState(true);

    const fetchFuncionarios = useCallback(() => {
        // Só busca os dados se tivermos um ID de Estabelecimento
        if (!estabelecimentoId) return;

        setLoading(true);
        api.get(`/funcionarios?estabelecimentoId=${estabelecimentoId}`)
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
export const useAddFuncionario = (estabelecimentoId: string, estabelecimentoNome: string) => {
    const [loading, setLoading] = useState(false);
    const [funcionario] = useState<ModelFuncionario>();
    const router = useRouter();
    const { showNotification } = useNotification();

    const addFuncionario = async (funcionario: ModelFuncionario) => {
        try {
            setLoading(true);
            funcionario.id = undefined;
            funcionario.estabelecimentoId = estabelecimentoId;
            await api.post('/funcionarios', { ...funcionario });
            showNotification('Funcionário cadastrado com sucesso!', 'success');
            router.push(`funcionarios?estabelecimentoId=${estabelecimentoId}&estabelecimentoNome=${estabelecimentoNome}`);
        } catch (error) {
            console.error("Erro ao cadastrar funcionário:", error);
            showNotification('Erro ao cadastrar funcionário.', 'error');
        } finally {
            setLoading(false);
            router.back();
        }
    };

    return { loading, addFuncionario, funcionario };
};

// Controller para editar um funcionário existente
export const useEditFuncionario = (funcionarioId: string | undefined, estabelecimentoId: string, estabelecimentoNome: string | undefined) => {
    const [loading, setLoading] = useState(false);
    const [funcionario, setFuncionario] = useState<ModelFuncionario>();
    const router = useRouter();
    const { showNotification } = useNotification();

    const carregarDadosFuncionario = useCallback(() => {
        if (funcionarioId) {
            setLoading(true);
            api.get(`/funcionarios/Id?funcionarioId=${funcionarioId}`)
                .then(response => {
                    if (response.data && response.data) {
                        setFuncionario(response.data);
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar dados do funcionário:", error);
                    showNotification('Erro ao buscar dados do funcionário.', 'error');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [funcionarioId]);

    useFocusEffect(carregarDadosFuncionario);

    const updateFuncionario = async (funcionario: ModelFuncionario) => {
        setLoading(true);
        try {
            await api.put('/funcionarios', funcionario);
            showNotification('Funcionário atualizado com sucesso!', 'success');
            router.push(`/funcionarios?estabelecimentoId=${estabelecimentoId}&estabelecimentoNome=${estabelecimentoNome}`);
        } catch (error) {
            showNotification('Erro ao atualizar funcionário.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { loading, funcionario, updateFuncionario };
};