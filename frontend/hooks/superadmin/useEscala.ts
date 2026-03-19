import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';

// --- Tipos ---
export interface EscalaDiaDto {
    diaSemana: number; // 0=Dom, 1=Seg...
    isFolga: boolean;
    entrada?: string; // "08:00:00"
    saidaIntervalo?: string;
    voltaIntervalo?: string;
    saida?: string;
}

export interface Escala {
    id: string;
    nome: string;
    cargaHorariaSemanal: number;
    empresaId: string;
    dias: EscalaDiaDto[];
}

export interface EscalaFormSchema {
    nome: string;
    cargaHorariaSemanal: string; // Form usa string para inputs numéricos
    dias: EscalaDiaDto[];
}

export const useEscala = (empresaId: string | null) => {
    const { showNotification } = useNotification();

    const [escalas, setEscalas] = useState<Escala[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Actions ---

    const fetchEscalas = useCallback(async () => {
        setLoading(true);
        console.log('Buscando escalas para empresaId:', empresaId);
        try {
            if (empresaId) {
                const response = await api.get(`/Escalas?empresaId=${empresaId}`);
                setEscalas(response.data);
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao carregar escalas.', 'error');
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    useFocusEffect(
        useCallback(() => {
            fetchEscalas();
        }, [fetchEscalas])
    );

    return { escalas, loading };
};

export const useAddEscala = (empresaId: string | null) => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showNotification } = useNotification();

    const createEscala = async (data: EscalaFormSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                cargaHorariaSemanal: Number(data.cargaHorariaSemanal),
                empresaId
            };
            await api.post('Escalas', payload);
            showNotification('Escala criada com sucesso!', 'success');
            router.back();
        } catch (error) {
            console.error(error);
            showNotification('Erro ao criar escala.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { loading, createEscala };
};

export const useEditEscala = (userId: string | null, escalaId: string) => {
    const [loading, setLoading] = useState(false);
    const [escala, setEscala] = useState<Escala>();
    const router = useRouter();
    const { showNotification } = useNotification();

    const carregarDadosEscala = useCallback(() => {
        if (escalaId) {
            setLoading(true);
            try {
                const response = api.get(`/Escalas/${escalaId}`)
                    .then(response => {
                        if (response.data && response.data) {
                            setEscala(response.data);
                        }
                    });
            } catch (error) {
                console.error(error);
                showNotification('Erro ao carregar escala.', 'error');
            } finally {
                setLoading(false);
            }
        }
    }, [escalaId]);

    useFocusEffect(carregarDadosEscala);

    const updateEscala = async (id: string, data: EscalaFormSchema) => {
        setLoading(true);
        try {
            const funcResp = await api.get(`Funcionarios/id?funcionarioId=${userId}`);
            const empresaId = funcResp.data?.estabelecimento?.empresaId;

            const payload = {
                ...data,
                cargaHorariaSemanal: Number(data.cargaHorariaSemanal),
                empresaId: empresaId, // Garante consistência
            };

            await api.put(`/Escalas/${id}`, payload);
            showNotification('Escala atualizada!', 'success');
            router.back()
        } catch (error) {
            console.error(error);
            showNotification('Erro ao atualizar escala.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { loading, escala, updateEscala };

};