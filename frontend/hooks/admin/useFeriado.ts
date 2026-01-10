import { useState, useCallback, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';

// Tipagem
export interface FeriadoPersonalizado {
    id: string;
    descricao: string;
    data: string;
    empresaId: string;
    estabelecimentoId?: string | null;
    ativo: boolean;
    estabelecimento?: { nomeFantasia: string; };
}

export interface FeriadoFormSchema {
    descricao: string;
    data: Date;
    estabelecimentoId: string; // 'GLOBAL' ou UUID
}

export interface DropdownItem {
    id: string;
    name: string;
}

export const useFeriado = (userId: string | null) => {
    const { showNotification } = useNotification();
    const [feriados, setFeriados] = useState<FeriadoPersonalizado[]>([]);
    const [loading, setLoading] = useState(false);
    const [estabelecimentosOpcoes, setEstabelecimentosOpcoes] = useState<DropdownItem[]>([]);

    // Buscar Feriados e Opções de Estabelecimento
    const fetchDados = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const funcResp = await api.get(`Funcionarios/id?funcionarioId=${userId}`);
            const empresaId = funcResp.data?.estabelecimento?.empresaId;

            if (empresaId) {
                // 1. Buscar Feriados
                const feriadosResp = await api.get(`/Feriados?empresaId=${empresaId}`);
                setFeriados(feriadosResp.data);

                for (let f of feriadosResp.data) {
                    if (f.estabelecimentoId && !f.estabelecimento) {
                        const estResp = await api.get(`/Estabelecimento/Id?estabelecimentoId=${f.estabelecimentoId}`);
                        f.estabelecimento = { nomeFantasia: estResp.data.nomeFantasia };
                    }
                }
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const toggleFeriadoAtivo = async (feriadoId: string) => {
        const originalFeriados = [...feriados];

        setFeriados(prevFeriados =>
            prevFeriados.map(f =>
                f.id === feriadoId ? { ...f, ativo: !f.ativo } : f
            )
        );

        try {
            await api.patch(`/Feriados?feriadoId=${feriadoId}`);
        } catch (error) {
            console.error("Erro ao atualizar status do feriado:", error);
            setFeriados(originalFeriados);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDados();
        }, [])
    );

    return { feriados, loading, toggleFeriadoAtivo };
};

export const useAddFeriado = (userId: string) => {
    const [loading, setLoading] = useState(false);
    const [estabelecimentosOpcoes, setEstabelecimentosOpcoes] = useState<DropdownItem[]>([]);
    const [empresaId, setEmpresaId] = useState<string>('');

    const router = useRouter();
    const { showNotification } = useNotification();

    const fetchDados = async () => {
        if (!userId) return;
        // Buscar Estabelecimentos para o Dropdown
        const funcResp = await api.get(`Funcionarios/id?funcionarioId=${userId}`);
        const empresaId = funcResp.data?.estabelecimento?.empresaId;
        setEmpresaId(empresaId);

        const estResp = await api.get(`/Estabelecimento?empresaId=${empresaId}`);
        const listaEst = Array.isArray(estResp.data) ? estResp.data : [estResp.data];

        const opcoes: DropdownItem[] = listaEst.map((e: any) => ({
            id: e.id,
            name: e.nomeFantasia,
        }));

        setEstabelecimentosOpcoes([{ id: 'GLOBAL', name: 'Toda a Empresa (Global)' }, ...opcoes]);
    };

    useFocusEffect(
        useCallback(() => {
            fetchDados();
        }, [])
    );

    const addFeriado = async (data: FeriadoFormSchema) => {
        try {
            setLoading(true);

            const payload = {
                descricao: data.descricao,
                data: data.data.toISOString(),
                empresaId,
                estabelecimentoId: data.estabelecimentoId === 'GLOBAL' ? null : data.estabelecimentoId,
                ativo: true
            };

            await api.post('/Feriados', payload);
            showNotification('Feriado criado com sucesso!', 'success');
            router.push({
                pathname: '/(admin)/feriados',
            });
        } catch (error) {
            console.error(error);
            showNotification('Erro ao criar feriado.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { loading, addFeriado, estabelecimentosOpcoes };
};