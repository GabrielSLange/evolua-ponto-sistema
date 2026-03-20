import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Text, Card, Avatar, useTheme, IconButton, Surface, Chip, Searchbar, Portal, Dialog, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function FiscalIndexScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth(); 
    const { showNotification } = useNotification();

    // --- ESTADOS ---
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    // Paginação e Filtros
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    // --- ESTADOS DE EXPORTAÇÃO ---
    const [exportDialogVisible, setExportDialogVisible] = useState(false);
    const [eventoParaExportar, setEventoParaExportar] = useState<any | null>(null);
    const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

    // 1. Descobrir a qual empresa esse fiscal pertence
    const carregarEmpresaDoFiscal = async () => {
        try {
            const response = await api.get(`/funcionarios/id?funcionarioId=${userId}`);
            if (response.data?.estabelecimento?.empresaId) {
                setEmpresaId(response.data.estabelecimento.empresaId);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do fiscal:", error);
        }
    };

    useEffect(() => {
        carregarEmpresaDoFiscal();
    }, [userId]);

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
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [empresaId, activeSearch]);

    
    useFocusEffect(
        useCallback(() => {
            if (empresaId) {
                fetchEventos(1);
            }
        }, [empresaId, fetchEventos])
    );

    // --- HANDLERS DA TELA ---
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
        router.push(`/(fiscal)/evento/${eventoId}`);
    };

    // --- HANDLERS DE EXPORTAÇÃO (API) ---
    const abrirDialogExportacao = (evento: any) => {
        setEventoParaExportar(evento);
        setExportDialogVisible(true);
    };

    const fecharDialogExportacao = () => {
        setExportDialogVisible(false);
        setEventoParaExportar(null);
    };

    const handleExport = async (formato: 'pdf' | 'excel') => {
        if (!eventoParaExportar) return;
        
        setExporting(formato);
        try {
            // Chamada à API com responseType 'blob' (crucial para arquivos)
            const response = await api.get(`api/Eventos/${eventoParaExportar.id}/exportar-${formato}`, {
                responseType: 'blob'
            });

            const nomeArquivo = `Lista_Presencas_${eventoParaExportar.nomeAplicacao.replace(/\s+/g, '_')}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;

            if (Platform.OS === 'web') {
                // Estratégia de download para Navegadores
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', nomeArquivo);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                // Para mobile (iOS/Android), futuramente será necessário:
                // await FileSystem.writeAsStringAsync(...) e Sharing.shareAsync(...)
                showNotification("Download nativo ainda requer configuração do FileSystem.", "info");
            }
            
            showNotification(`Relatório em ${formato.toUpperCase()} gerado com sucesso!`, 'success');
            fecharDialogExportacao();
        } catch (error) {
            console.error(`Erro ao exportar ${formato}:`, error);
            showNotification(`Erro ao gerar relatório em ${formato.toUpperCase()}. Verifique a conexão.`, 'error');
        } finally {
            setExporting(null);
        }
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
                         <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                {item.totalInscritos}
                            </Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>Alunos</Text>
                         </View>
                    </View>
                </Card.Content>
                {/* Nova área de ações na parte inferior do Card */}
                <Card.Actions style={styles.cardActions}>
                     <Button 
                         icon="cloud-download-outline" 
                         mode="outlined" 
                         textColor={theme.colors.primary}
                         onPress={() => abrirDialogExportacao(item)}
                         style={{ borderRadius: 8 }}
                     >
                         Lista de Presenças
                     </Button>
                </Card.Actions>
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

                <FlatList
                    data={eventos}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    scrollEnabled={true}
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

            {/* --- DIALOG DE EXPORTAÇÃO --- */}
            <Portal>
                <Dialog 
                    visible={exportDialogVisible} 
                    onDismiss={fecharDialogExportacao} 
                    style={styles.dialog}
                >
                    <Dialog.Icon icon="file-document-multiple-outline" color={theme.colors.primary} size={40} />
                    <Dialog.Title style={{ textAlign: 'center' }}>Exportar Presença</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 12 }}>
                            Como deseja baixar o relatório de presença do evento abaixo?
                        </Text>
                        <Text variant="titleMedium" style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 24, color: theme.colors.primary }}>
                            {eventoParaExportar?.nomeAplicacao}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', gap: 10 }}>
                            <Button 
                                mode="contained" 
                                icon="file-pdf-box" 
                                buttonColor="#E53935" 
                                onPress={() => handleExport('pdf')}
                                loading={exporting === 'pdf'}
                                disabled={exporting !== null}
                                style={{ flex: 1 }}
                            >
                                PDF
                            </Button>
                            <Button 
                                mode="contained" 
                                icon="file-excel" 
                                buttonColor="#107C41" 
                                onPress={() => handleExport('excel')}
                                loading={exporting === 'excel'}
                                disabled={exporting !== null}
                                style={{ flex: 1 }}
                            >
                                EXCEL
                            </Button>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions style={{ justifyContent: 'center', marginTop: 8 }}>
                        <Button onPress={fecharDialogExportacao} disabled={exporting !== null} textColor={theme.colors.onSurfaceVariant}>
                            Cancelar
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
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
    leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rightContent: { alignItems: 'flex-end', justifyContent: 'center' }, 
    cardActions: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0, justifyContent: 'flex-end' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
    
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
        width: '90%',       
        maxWidth: 400, 
        alignSelf: 'center' 
    }
});