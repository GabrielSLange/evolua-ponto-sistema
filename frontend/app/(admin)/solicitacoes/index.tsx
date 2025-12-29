import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Avatar, ActivityIndicator, TextInput, useTheme, IconButton, HelperText } from 'react-native-paper';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useFocusEffect } from 'expo-router';
import { SolicitacaoPontoDto } from '@/models/Dtos/SolicitacaoPontoDto';
import { useAuth } from '@/contexts/AuthContext';
import CustomLoader from '@/components/CustomLoader';

export default function SolicitacoesScreen() {
    const theme = useTheme();
    const { userId } = useAuth();

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
            Alert.alert('Erro', 'Falha ao buscar solicitações pendentes.');
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
                // Remove da lista localmente para ser rápido
                setSolicitacoes(prev => prev.filter(item => item.id !== id));
                Alert.alert("Sucesso", "Ponto aprovado!");
            } else {
                Alert.alert("Erro", response.data.errorMessage || "Não foi possível aprovar.");
            }
        } catch (error) {
            Alert.alert("Erro", "Erro de conexão ao aprovar.");
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
        setRejectModalVisible(false); // Fecha modal visualmente enquanto processa

        try {
            const response = await api.put(`/RegistroPonto/avaliar/${selectedId}`, {
                aprovado: false,
                justificativaAdmin: motivoRejeicao
            });

            if (response.data.success) {
                setSolicitacoes(prev => prev.filter(item => item.id !== selectedId));
                Alert.alert("Sucesso", "Solicitação rejeitada.");
            } else {
                Alert.alert("Erro", response.data.errorMessage || "Erro ao rejeitar.");
            }
        } catch (error) {
            Alert.alert("Erro", "Erro ao processar rejeição.");
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
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Solicitações Pendentes</Text>
                <Text variant="bodyMedium" style={{ color: '#666' }}>
                    {solicitacoes.length} solicitações aguardando análise
                </Text>
            </View>

            {loading && solicitacoes.length === 0 ? (
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={loading}
                >
                    <View style={styles.loaderOverlay}>
                    <CustomLoader />
                    </View>
                </Modal>
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

            {/* --- MODAL DE REJEIÇÃO --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={rejectModalVisible}
                onRequestClose={() => setRejectModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <Text variant="titleLarge" style={{ marginBottom: 10 }}>Motivo da Rejeição</Text>
                        <Text variant="bodyMedium" style={{ marginBottom: 10, color: '#666' }}>
                            Por que você está rejeitando este ponto? O funcionário verá esta mensagem.
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
                            style={{ backgroundColor: theme.colors.surface }}
                        />

                        <HelperText type="error" visible={errorMotivo} style={{ marginBottom: 10 }}>
                            O motivo da rejeição é obrigatório.
                        </HelperText>

                        <View style={styles.modalButtons}>
                            <Button onPress={() => setRejectModalVisible(false)} style={{ flex: 1, borderColor: theme.colors.outline, borderWidth: 1 }} mode="outlined">
                                Cancelar
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor={theme.colors.error}
                                onPress={handleConfirmarRejeicao}
                                style={{ flex: 1 }}
                            >
                                Confirmar Rejeição
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
            

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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 20,
        borderRadius: 8,
        elevation: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    loaderOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      alignItems: 'center',
      justifyContent: 'center',
   },
});