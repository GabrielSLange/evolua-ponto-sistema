import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native'; // Removi Modal daqui
import { Text, Card, Button, Avatar, ActivityIndicator, TextInput, useTheme, HelperText, Divider, Modal, Portal } from 'react-native-paper'; // Adicionei Modal e Portal aqui
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useFocusEffect } from 'expo-router';
import { SolicitacaoPontoDto } from '@/models/Dtos/SolicitacaoPontoDto';
import { useAuth } from '@/contexts/AuthContext';
import CustomLoader from '@/components/CustomLoader';
import { useBadge } from '@/contexts/BadgeContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function SolicitacoesScreen() {
    const theme = useTheme();
    const { userId } = useAuth();
    const { refreshBadges } = useBadge();
    const { showNotification } = useNotification();

    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPontoDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Estados para o Modal de Rejeição
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [motivoRejeicao, setMotivoRejeicao] = useState('');

    // Estado para controlar o erro visual no input do motivo de rejeição
    const [errorMotivo, setErrorMotivo] = useState(false);

    // --- BUSCAR DADOS ---
    const fetchSolicitacoes = async () => {
        const funcionarioId = userId;

        if (!funcionarioId) return;
        setLoading(true);
        try {
            const response = await api.get('/RegistroPonto/pendentes', {
                params: { funcionarioId: funcionarioId }
            });
            if (response.data.success) {
                setSolicitacoes(response.data.data);
            }
        } catch (error) {
            console.error(error);
            showNotification('Falha ao buscar solicitações pendentes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSolicitacoes();
        }, [userId])
    );

    // --- AÇÕES ---

    const handleAprovar = async (id: number) => {
        setProcessingId(id);
        try {
            const response = await api.put(`/RegistroPonto/avaliar/${id}`, {
                aprovado: true,
                justificativaAdmin: "Aprovado pelo gestor"
            });

            if (response.data.success) {
                setSolicitacoes(prev => prev.filter(item => item.id !== id));
                refreshBadges();
                showNotification('Ponto aprovado!', 'success');
            } else {
                showNotification(response.data.errorMessage === null ? "Não foi possível aprovar." : response.data.errorMessage, 'error');
            }
        } catch (error) {
            showNotification("Erro de conexão ao aprovar.", 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (id: number) => {
        setSelectedId(id);
        setMotivoRejeicao('');
        setErrorMotivo(false);
        setRejectModalVisible(true);
    };

    const handleConfirmarRejeicao = async () => {
        if (!selectedId) return;
        if (!motivoRejeicao.trim()) {
            setErrorMotivo(true);
            return;
        }

        setProcessingId(selectedId);
        setRejectModalVisible(false);

        try {
            const response = await api.put(`/RegistroPonto/avaliar/${selectedId}`, {
                aprovado: false,
                justificativaAdmin: motivoRejeicao
            });

            if (response.data.success) {
                setSolicitacoes(prev => prev.filter(item => item.id !== selectedId));
                refreshBadges();
                showNotification('Ponto rejeitado!', 'success');
            } else {
                showNotification(response.data.errorMessage === null ? "Não foi possível rejeitar." : response.data.errorMessage, 'error');
            }
        } catch (error) {
            showNotification("Erro de conexão ao rejeitar.", 'error');
        } finally {
            setProcessingId(null);
            setSelectedId(null);
        }
    };

    // --- RENDER ---

    const renderItem = ({ item }: { item: SolicitacaoPontoDto }) => {
        const dataObj = new Date(item.timestampMarcacao);
        const dataFormatada = dataObj.toLocaleDateString('pt-BR');
        const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const isProcessing = processingId === item.id;

        return (
            <Card style={styles.card}>
                <Card.Title
                    title={item.funcionario.nome || "Funcionário Desconhecido"}
                    subtitle={item.funcionario.cpf || "CPF Desconhecido"}
                    left={(props) => <Avatar.Icon {...props} icon="account-clock" style={{ backgroundColor: theme.colors.primary }} />}
                />
                <Card.Content>
                    <View style={styles.rowInfo}>
                        <Text style={styles.label}>Tipo:</Text>
                        <Text style={{ fontWeight: 'bold', color: item.tipo.includes('ENTRADA') ? 'green' : 'orange' }}>
                            {item.tipo}
                        </Text>
                    </View>
                    <View style={styles.rowInfo}>
                        <Text style={styles.label}>Data/Hora:</Text>
                        <Text>{dataFormatada} às {horaFormatada}</Text>
                    </View>
                    <View style={[styles.justificativaBox, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.labelJustificativa, { color: theme.colors.onSurface }]}>Justificativa do Funcionário:</Text>
                        <Text style={[styles.textoJustificativa, { color: theme.colors.onSurface }]}>{item.justificativaFuncionario || 'Sem justificativa'}</Text>
                    </View>
                </Card.Content>

                <Card.Actions style={styles.actions}>
                    {isProcessing ? (
                        <ActivityIndicator animating={true} color={theme.colors.primary} />
                    ) : (
                        <>
                            <Button
                                mode="outlined"
                                textColor={theme.colors.error}
                                onPress={() => openRejectModal(item.id)}
                                style={{ borderColor: theme.colors.error }}
                            >
                                Rejeitar
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor="green"
                                onPress={() => handleAprovar(item.id)}
                            >
                                Aprovar
                            </Button>
                        </>
                    )}
                </Card.Actions>
            </Card>
        );
    };

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Solicitações Pendentes</Text>
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                    {solicitacoes.length} solicitações aguardando análise
                </Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <Divider style={{ marginBottom: 16, marginTop: 8 }} />
            </View>

            {loading && solicitacoes.length === 0 ? (
                // Usando Portal para o Loader também, para garantir consistência
                <Portal>
                    <Modal visible={true} dismissable={false} contentContainerStyle={styles.loaderContainer}>
                         <CustomLoader />
                    </Modal>
                </Portal>
            ) : (
                <FlatList
                    data={solicitacoes}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Avatar.Icon icon="check-all" size={60} style={{ backgroundColor: '#e0e0e0' }} />
                            <Text style={{ marginTop: 10, color: '#888' }}>Nenhuma solicitação pendente.</Text>
                        </View>
                    }
                />
            )}

            {/* --- MODAL DE REJEIÇÃO COM PORTAL (React Native Paper) --- */}
            <Portal>
                <Modal
                    visible={rejectModalVisible}
                    onDismiss={() => setRejectModalVisible(false)}
                    // AQUI ESTÁ A CORREÇÃO: Passamos o estilo diretamente aqui para garantir a sobreposição
                    contentContainerStyle={{
                        backgroundColor: theme.colors.background,
                        padding: 20,
                        borderRadius: 12,
                        // TRUQUE PARA RESPEITAR LIMITES:
                        alignSelf: 'center', // Centraliza horizontalmente
                        width: '90%',        // No celular, ocupa 90% da tela
                        maxWidth: 500,       // No desktop/tablet, trava em 500px
                        // Se o teclado subir, isso ajuda a não quebrar:
                        maxHeight: '80%',    
                    }}
                >
                    {/* KeyboardAvoidingView ajuda o modal a subir quando o teclado aparece */}
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        
                        <Text variant="titleLarge" style={{ marginBottom: 10, fontWeight: 'bold' }}>
                            Motivo da Rejeição
                        </Text>
                        
                        <Text variant="bodyMedium" style={{ marginBottom: 12, color: theme.colors.onSurfaceVariant }}>
                            O funcionário verá esta mensagem ao visualizar o ponto rejeitado.
                        </Text>

                        <TextInput
                            mode="outlined"
                            placeholder="Ex: Hora inconsistente com a escala..."
                            multiline
                            numberOfLines={3}
                            value={motivoRejeicao}
                            onChangeText={(text) => {
                                setMotivoRejeicao(text);
                                if (text.trim().length > 0) setErrorMotivo(false);
                            }}
                            error={errorMotivo}
                            style={{ backgroundColor: theme.colors.surface, marginBottom: 5 }}
                        />

                        <HelperText type="error" visible={errorMotivo} style={{ marginBottom: 5 }}>
                            O motivo da rejeição é obrigatório.
                        </HelperText>

                        <View style={styles.modalButtons}>
                            <Button 
                                onPress={() => setRejectModalVisible(false)} 
                                style={{ flex: 1, borderColor: theme.colors.outline }} 
                                mode="outlined"
                            >
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor={theme.colors.error}
                                onPress={handleConfirmarRejeicao}
                                style={{ flex: 1 }}
                            >
                                Confirmar
                            </Button>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </Portal>

        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 16,
        backgroundColor: 'transparent',
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        elevation: 2,
    },
    rowInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        color: '#666',
        fontWeight: '500',
    },
    justificativaBox: {
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
    },
    labelJustificativa: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    textoJustificativa: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#333',
    },
    actions: {
        justifyContent: 'flex-end',
        gap: 10,
        paddingRight: 16,
        paddingBottom: 10,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10, // Um pouco mais de espaço
    },
    // Estilos novos para o Modal do Paper
    paperModalContainer: {
        margin: 20, // Garante que não encoste nas bordas
        padding: 20,
        borderRadius: 12,
    },
    loaderContainer: {
        alignSelf: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10
    }
});