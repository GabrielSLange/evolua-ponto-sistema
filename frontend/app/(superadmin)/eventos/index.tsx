import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Card, Avatar, useTheme, IconButton, Surface, Chip, Searchbar, Portal, Dialog, Button } from 'react-native-paper';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext'; // <-- Importar notificação

export default function FiscalIndexScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();
    const { showNotification } = useNotification(); // <-- Hook de notificação

    const { empresaId } = useLocalSearchParams();

    // --- ESTADOS ---
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Paginação e Filtros
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState(''); 

    // --- ESTADOS DE EXCLUSÃO ---
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [eventoParaExcluir, setEventoParaExcluir] = useState<any | null>(null);
    const [deletando, setDeletando] = useState(false);

    // 2. Buscar Eventos com paginação e filtro
    const fetchEventos = useCallback(async (pageNumber: number, isRefresh = false, searchParam = activeSearch) => {
        if (!empresaId) return;
        
        setLoading(!isRefresh);
        if (isRefresh) setRefreshing(true);

        try {
            const response = await api.get(`api/Eventos/empresa/${empresaId}`, {
                params: {
                    page: pageNumber,
                    pageSize: 10,
                    search: searchParam
                }
            });
            
            setEventos(response.data.data);
            setTotalPages(response.data.totalPages);
            setPage(pageNumber);
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);
            showNotification("Erro ao carregar a lista de eventos.", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [empresaId, activeSearch, showNotification]);

    
    useFocusEffect(
        useCallback(() => {
            if (empresaId) {
                fetchEventos(1);
            }
        }, [empresaId, fetchEventos])
    );

    // --- HANDLERS DA EXCLUSÃO ---

    const confirmarExclusao = (evento: any) => {
        setEventoParaExcluir(evento);
        setDeleteDialogVisible(true);
    };

    const cancelarExclusao = () => {
        setEventoParaExcluir(null);
        setDeleteDialogVisible(false);
    };

    const handleExcluirEvento = async () => {
        if (!eventoParaExcluir) return;

        setDeletando(true);
        try {
            await api.delete(`api/Eventos/${eventoParaExcluir.id}`);
            
            showNotification('Evento e vínculos excluídos com sucesso!', 'success');
            setDeleteDialogVisible(false);
            setEventoParaExcluir(null);
            
            // Recarrega a página atual para refletir a exclusão
            fetchEventos(page); 

        } catch (error) {
            console.error("Erro ao excluir:", error);
            showNotification('Erro ao excluir o evento. Tente novamente.', 'error');
        } finally {
            setDeletando(false);
        }
    };

    // --- OUTROS HANDLERS ---
    const handleRefresh = () => fetchEventos(1, true);
    const handleNextPage = () => { if (page < totalPages) fetchEventos(page + 1); };
    const handlePrevPage = () => { if (page > 1) fetchEventos(page - 1); };
    
    const handleSearch = () => {
        setActiveSearch(searchQuery);
        fetchEventos(1, false, searchQuery);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setActiveSearch('');
        fetchEventos(1, false, '');
    };

    const navigateToSala = (eventoId: string) => {
        router.push(`/(superadmin)/eventos/evento/${eventoId}`);
    };

    // --- RENDER DOS CARDS ---
    const renderItem = ({ item }: any) => {
        return (
            <Card style={styles.card} onPress={() => navigateToSala(item.id)}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.leftContent}>
                        <Avatar.Icon 
                            size={44} 
                            icon="clipboard-text-outline" 
                            style={{ backgroundColor: theme.colors.primaryContainer }} 
                            color={theme.colors.primary} 
                        />
                        <View style={{ marginLeft: 16, flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }} numberOfLines={1}>
                                {item.nomeAplicacao}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                                {item.periodoAplicacao}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.rightContent}>
                         {/* Novo Botão de Excluir */}
                         <IconButton 
                            icon="delete-outline" 
                            iconColor={theme.colors.error} 
                            size={20}
                            onPress={() => confirmarExclusao(item)}
                         />
                         <View style={{ alignItems: 'flex-end', marginTop: -8 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                {item.totalInscritos}
                            </Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>Alunos</Text>
                         </View>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            
            <View style={styles.header}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                    Provas e Eventos
                </Text>
            </View>

            <ScreenContainer>
                <Searchbar
                    placeholder="Buscar por data ou aplicação..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    onSubmitEditing={handleSearch}
                    onIconPress={handleSearch}
                    onClearIconPress={clearSearch}
                    style={{ marginBottom: 16, backgroundColor: theme.colors.surfaceVariant, elevation: 0 }}
                />

                {activeSearch !== '' && (
                    <View style={styles.activeFilters}>
                        <Chip icon="magnify" onClose={clearSearch}>
                            Buscando: {activeSearch}
                        </Chip>
                    </View>
                )}

                {/* FlatList movida para fora de uma View desnecessária se não tiver scrollEnabled extra */}
                <FlatList
                    data={eventos}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    contentContainerStyle={{ paddingBottom: 100 }} 
                    ListFooterComponent={loading && !refreshing ? <ActivityIndicator style={{ margin: 20 }} color={theme.colors.primary} /> : null}
                    ListEmptyComponent={!loading ? <Text style={styles.emptyText}>Nenhuma prova encontrada.</Text> : null}
                />
            </ScreenContainer>

            {/* RODAPÉ DE PAGINAÇÃO */}
            <Surface style={[styles.paginationFooter, { backgroundColor: theme.colors.elevation.level2 }]} elevation={4}>
                <View style={styles.paginationContent}>
                    <IconButton 
                        icon="chevron-left" 
                        mode="contained-tonal" 
                        disabled={page === 1 || loading} 
                        onPress={handlePrevPage} 
                        size={24} 
                    />
                    <View style={styles.pageIndicator}>
                        {loading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                                Página <Text style={{fontWeight:'bold', color: theme.colors.primary}}>{page}</Text> de {totalPages === 0 ? 1 : totalPages}
                            </Text>
                        )}
                    </View>
                    <IconButton 
                        icon="chevron-right" 
                        mode="contained-tonal" 
                        disabled={page === totalPages || totalPages === 0 || loading} 
                        onPress={handleNextPage} 
                        size={24} 
                    />
                </View>
            </Surface>

            {/* --- DIALOG DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
            <Portal>
                <Dialog 
                    visible={deleteDialogVisible} 
                    onDismiss={cancelarExclusao} 
                    style={styles.dialog} // <-- Alteração aqui
                >
                    <Dialog.Icon icon="alert" color={theme.colors.error} size={40} />
                    <Dialog.Title style={{ textAlign: 'center' }}>Excluir Evento?</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
                            Você está prestes a excluir permanentemente o evento:
                        </Text>
                        <Text variant="titleMedium" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                            {eventoParaExcluir?.nomeAplicacao}
                        </Text>
                        <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.error, marginTop: 16 }}>
                            Atenção: Todas as salas, locais de prova e inscrições de alunos vinculados a este evento serão apagados. Esta ação não pode ser desfeita.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'center', gap: 10 }}>
                        <Button onPress={cancelarExclusao} disabled={deletando} textColor={theme.colors.onSurfaceVariant}>
                            Cancelar
                        </Button>
                        <Button 
                            mode="contained" 
                            buttonColor={theme.colors.error} 
                            onPress={handleExcluirEvento}
                            loading={deletando}
                            disabled={deletando}
                        >
                            Sim, Excluir
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </View>
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeFilters: { flexDirection: 'row', marginBottom: 16 },
    card: { marginBottom: 12, elevation: 1 },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rightContent: { alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }, // Ajustado para distribuir o ícone e os números
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
    
    // Estilo fixo do rodapé
    paginationFooter: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0,
        right: 0, 
        padding: 10, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: -2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 3, 
    },
    paginationContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 400, alignSelf: 'center', width: '100%' },
    pageIndicator: { alignItems: 'center', justifyContent: 'center' },
    dialog: {
        borderRadius: 12,
        width: '90%',       // Garante uma margem nas laterais em telas pequenas (mobile)
        maxWidth: 500,      // Trava o crescimento em telas grandes (web/tablet)
        alignSelf: 'center' // Centraliza o modal horizontalmente
    },
});