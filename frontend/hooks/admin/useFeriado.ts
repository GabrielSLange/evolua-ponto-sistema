import { useState, useCallback } from 'react';
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
    estabelecimento?: {nomeFantasia: string; };
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

                for(let f of feriadosResp.data) {
                    if(f.estabelecimentoId && !f.estabelecimento) {
                        const estResp = await api.get(`/Estabelecimento/Id?estabelecimentoId=${f.estabelecimentoId}`);
                        f.estabelecimento = { nomeFantasia: estResp.data.nomeFantasia };
                    }
                }

                // 2. Buscar Estabelecimentos para o Dropdown
                const estResp = await api.get(`/Estabelecimento?empresaId=${empresaId}`);
                const listaEst = Array.isArray(estResp.data) ? estResp.data : [estResp.data];

                const opcoes: DropdownItem[] = listaEst.map((e: any) => ({
                    id: e.id,
                    name: e.nomeFantasia,
                }));

                setEstabelecimentosOpcoes([{ id: 'GLOBAL', name: 'Toda a Empresa (Global)' }, ...opcoes]);
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            fetchDados();
        }, [])
    );

    return { feriados, loading, estabelecimentosOpcoes };
};

// Criar
/* const createFeriado = async (data: FeriadoFormSchema) => {
    setLoading(true);
    try {
        const funcResp = await api.get(`Funcionarios/id?funcionarioId=${userId}`);
        const empresaId = funcResp.data?.estabelecimento?.empresaId;

        const payload = {
            descricao: data.descricao,
            data: data.data.toISOString(),
            empresaId,
            estabelecimentoId: data.estabelecimentoId === 'GLOBAL' ? null : data.estabelecimentoId,
            ativo: true
        };

        await api.post('/Feriados', payload);
        showNotification('Feriado criado com sucesso!', 'success');
        router.back();
    } catch (error) {
        console.error(error);
        showNotification('Erro ao criar feriado.', 'error');
    } finally {
        setLoading(false);
    }
}; */

// Editar (Nota: Backend precisa suportar PUT /Feriados ou PUT /Feriados/{id})
/* const updateFeriado = async (id: string, data: FeriadoFormSchema) => {
    setLoading(true);
    try {
        // Se o seu backend não tiver update, teremos que fazer Delete + Create
        // Assumindo aqui que você criará um endpoint PUT
        const payload = {
            id,
            descricao: data.descricao,
            data: data.data.toISOString(),
            estabelecimentoId: data.estabelecimentoId === 'GLOBAL' ? null : data.estabelecimentoId,
            ativo: true
        };

        await api.put('/Feriados', payload);
        showNotification('Feriado atualizado!', 'success');
        router.back();
    } catch (error) {
        console.error(error);
        showNotification('Erro ao atualizar feriado.', 'error');
    } finally {
        setLoading(false);
    }
}; */

// Deletar
/* const deleteFeriado = async (id: string) => {
    try {
        await api.delete(`/Feriados/${id}`);
        showNotification('Feriado removido.', 'success');
        setFeriados(prev => prev.filter(f => f.id !== id));
    } catch (error) {
        showNotification('Erro ao remover feriado.', 'error');
    }
}; */