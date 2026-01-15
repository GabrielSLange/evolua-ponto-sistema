import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';

// Interface Unificada para a View de Feriados
export interface FeriadoView {
    id: string;
    descricao: string;
    data: string;
    tipo: 'NACIONAL' | 'PERSONALIZADO';
    ativo: boolean;
    empresaId?: string;
    estabelecimentoId?: string | null;
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

export type FiltroFeriado = 'TODOS' | 'NACIONAIS' | 'PERSONALIZADOS';

export const useFeriado = (userId: string | null) => {
    const { showNotification } = useNotification();

    const [todosFeriados, setTodosFeriados] = useState<FeriadoView[]>([]);
    const [filtro, setFiltro] = useState<FiltroFeriado>('TODOS');
    const [loading, setLoading] = useState(false);

    // Buscar Feriados e Opções de Estabelecimento
    const fetchDados = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const funcResp = await api.get(`Funcionarios/id?funcionarioId=${userId}`);
            const empresaId = funcResp.data?.estabelecimento?.empresaId;

            if (empresaId) {
                const anoAtual = new Date().getFullYear();

                // Busca Personalizados e Nacionais em paralelo
                const [respPersonalizados, respNacionais] = await Promise.all([
                    api.get(`/Feriados?empresaId=${empresaId}`),
                    api.get(`/Feriados/Nacionais?ano=${anoAtual}`)
                ]);

                // Normaliza Personalizados
                const personalizados: FeriadoView[] = [];
                for (let f of respPersonalizados.data) {
                    let nomeEst = "Global";
                    
                    if (f.estabelecimentoId) {
                        try {
                            const estabelecimentoResp = await api.get(`/Estabelecimento/Id?estabelecimentoId=${f.estabelecimentoId}`);
                            nomeEst = estabelecimentoResp.data.nomeFantasia;
                        } catch {
                            nomeEst = "Unidade Específica";
                        }
                    }

                    personalizados.push({
                        id: f.id,
                        descricao: f.descricao,
                        data: f.data,
                        tipo: 'PERSONALIZADO',
                        ativo: f.ativo,
                        empresaId: f.empresaId,
                        estabelecimentoId: f.estabelecimentoId,
                        estabelecimento: { nomeFantasia: nomeEst }
                    });
                }

                // Normaliza Nacionais
                const nacionais: FeriadoView[] = (respNacionais.data.data || []).map((f: any, index: number) => ({
                    id: `nac-${index}-${f.date}`, // ID fictício para chave do React
                    descricao: f.name,
                    data: new Date(f.date).toISOString(),
                    tipo: "NACIONAL",
                    ativo: true,
                    estabelecimento: { nomeFantasia: "Nacional" }
                }));

                // Unifica e ordena os feriados
                const listaUnificada = [...nacionais, ...personalizados].sort((a, b) =>
                    new Date(a.data).getTime() - new Date(b.data).getTime()
                );

                setTodosFeriados(listaUnificada);
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const toggleFeriadoAtivo = async (feriadoId: string) => {
        const originalFeriados = [...todosFeriados];

        // Encontra o feriado para verificar se é personalizado
        const alvoFeriado = todosFeriados.find(f => f.id === feriadoId);
        if (!alvoFeriado || alvoFeriado.tipo === 'NACIONAL') return;

        setTodosFeriados(prev => prev.map(f =>
            f.id === feriadoId ? { ...f, ativo: !f.ativo } : f
        ));

        try {
            await api.patch(`/Feriados?feriadoId=${feriadoId}`);
        } catch (error) {
            console.error("Erro ao atualizar status do feriado:", error);
            showNotification('Erro ao atualizar status do feriado.', 'error');
            setTodosFeriados(originalFeriados);
        }
    };

    const feriadosFiltrados = useMemo(() => {
        if (filtro === 'TODOS') return todosFeriados;
        return todosFeriados.filter(f => f.tipo === (filtro === 'NACIONAIS' ? 'NACIONAL' : 'PERSONALIZADO'));
    }, [todosFeriados, filtro]);

    useFocusEffect(
        useCallback(() => {
            fetchDados();
        }, [])
    );

    return { feriados: feriadosFiltrados, filtro, loading, setFiltro, toggleFeriadoAtivo };
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