import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, useTheme, Button, IconButton, Chip, Divider, Searchbar, List, Portal, Modal, Surface } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { ModelFuncionario } from '@/models/ModelFuncionario';
import DetalhesPontoModal from '@/components/modals/DetalhesPontoModal';

const toISODateString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

interface FuncionarioSimplificado {
    id: number;
    nome: string;
    cpf: string;
    cargo: string;
}

export default function HistoricoPontosScreen() {
    const theme = useTheme();
    const paperTheme = useTheme();
    const { userId } = useAuth();
    const { width } = useWindowDimensions(); 

    // --- ESTADOS ---
    const [pontos, setPontos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1); 
    
    // Filtros e Modais
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [funcionarios, setFuncionarios] = useState<FuncionarioSimplificado[]>([]);
    const [dadosFuncionario, setFuncionario] = useState<ModelFuncionario | null>(null);
    const [filteredFuncionarios, setFilteredFuncionarios] = useState<FuncionarioSimplificado[]>([]);
    const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioSimplificado | null>(null);
    const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);

    // Datas
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const [dataInicio, setDataInicio] = useState<Date | undefined>(inicioMes);
    const [dataFim, setDataFim] = useState<Date | undefined>(hoje);
    const [showPickerInicio, setShowPickerInicio] = useState(false);
    const [showPickerFim, setShowPickerFim] = useState(false);

    // Carregamento
    const carregarDados = async (idDoUsuario: string | null) => {
      try {
        setLoadingFuncionarios(true);
        const responseFunc = await api.get(`/funcionarios/id?funcionarioId=${idDoUsuario}`);
        const dadosFuncionario = responseFunc.data;

        if (dadosFuncionario) {
          setFuncionario(dadosFuncionario);
          const responseFuncionarios = await api.get(`/funcionarios?empresaId=${dadosFuncionario?.estabelecimento?.empresaId}`);
          if (responseFuncionarios.data) {
            setFuncionarios(responseFuncionarios.data); 
            setFilteredFuncionarios(responseFuncionarios.data); 
          }
        }      
      } catch (error) { console.error("Erro ao carregar dados:", error); }
      finally { setLoadingFuncionarios(false); }
    };
    
    useEffect(() => { carregarDados(userId); }, [userId]);

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        if (query) {
            setFilteredFuncionarios(funcionarios.filter(f => f.nome.toLowerCase().includes(query.toLowerCase()) || f.cpf.includes(query)));
        } else {
            setFilteredFuncionarios(funcionarios);
        }
    };

    const fetchPontos = async (pageNumber: number, shouldRefresh = false, overrideFilters?: any) => {
        if (loading) return;
        setLoading(true);
        try {
            const params: any = { page: pageNumber, pageSize: 10, empresaId: dadosFuncionario?.estabelecimento?.empresaId };
            const func = overrideFilters?.funcionario ?? selectedFuncionario;
            if (func) params.funcionarioId = func.id;
            const dtIni = overrideFilters?.inicio ?? dataInicio;
            if (dtIni) params.dataInicio = toISODateString(dtIni);
            const dtFim = overrideFilters?.fim ?? dataFim;
            if (dtFim) params.dataFim = toISODateString(dtFim);

            const response = await api.get('/RegistroPonto/historico-ponto', { params });
            setPontos(response.data.data);
            setTotalPages(response.data.totalPages);
            setPage(pageNumber); 
        } catch (error) { console.error("Erro ao buscar histórico", error); } 
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => {
        if (dadosFuncionario?.estabelecimento?.empresaId) fetchPontos(1, true);
    }, [dadosFuncionario]); 

    const handleRefresh = () => { setRefreshing(true); fetchPontos(1, true); };
    const handleNextPage = () => { if (page < totalPages) fetchPontos(page + 1); };
    const handlePrevPage = () => { if (page > 1) fetchPontos(page - 1); };
    
    const applyFilters = () => { setFilterModalVisible(false); fetchPontos(1, true); };
    const clearAllFilters = () => {
        setSelectedFuncionario(null); setDataInicio(undefined); setDataFim(undefined); setFilterModalVisible(false);
        setTimeout(() => fetchPontos(1, true), 100);
    };

    const onChangeDataInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPickerInicio(Platform.OS === 'ios');
        if (selectedDate) setDataInicio(new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())));
    };
    const onChangeDataFim = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPickerFim(Platform.OS === 'ios');
        if (selectedDate) setDataFim(new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())));
    };

    // Modal Handlers
    const [detalhesModalVisible, setDetalhesModalVisible] = useState(false);
    const [pontoSelecionado, setPontoSelecionado] = useState<any>(null);
    const handleOpenDetalhes = (item: any) => {
        setPontoSelecionado(item);
        setDetalhesModalVisible(true);
    };

    const renderItem = ({ item }: any) => {
        const isEntrada = item.tipo === 'ENTRADA';
        const dateObj = new Date(item.timestampMarcacao);
        return (
            <Card style={styles.card} onPress={() => handleOpenDetalhes(item)}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.leftContent}>
                        <Avatar.Icon size={40} icon={isEntrada ? "login" : "logout"} style={{ backgroundColor: isEntrada ? theme.colors.primaryContainer : theme.colors.errorContainer }} color={isEntrada ? theme.colors.primary : theme.colors.error} />
                        <View style={{ marginLeft: 12 }}>
                            <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>{item.funcionarioNome}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{item.funcionarioCargo}</Text>
                        </View>
                    </View>
                    <View style={styles.rightContent}>
                         <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{format(dateObj, "HH:mm")}</Text>
                         <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{format(dateObj, "dd/MM/yy", { locale: ptBR })}</Text>
                        {item.latitude && item.longitude && <Avatar.Icon size={16} icon="map-marker" style={{ backgroundColor: 'transparent', alignSelf: 'flex-end', marginTop: 4 }} color="green" />}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    // --- CORREÇÃO DO ERRO ---
    // Adicionei "as const" no alignSelf: 'center' para o TypeScript entender que é um valor fixo de estilo
    const isDesktop = Platform.OS === 'web' && width > 768;
    const footerStyle: any = { width: '100%', alignSelf: 'center' as const }

    return (
        // 1. View Principal que segura a tela inteira (sem scroll)
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            
            {/* 2. ScreenContainer lida com o Scroll (Conteúdo) */}
            <ScreenContainer>
                {/* Cabeçalho */}
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Histórico de Pontos</Text>
                    <IconButton icon="filter-variant" mode="contained" onPress={() => setFilterModalVisible(true)} />
                </View>
                
                <View style={styles.activeFilters}>
                    {selectedFuncionario && <Chip icon="account" onClose={() => { setSelectedFuncionario(null); handleRefresh(); }}>{selectedFuncionario.nome.split(' ')[0]}</Chip>}
                    {dataInicio && <Chip icon="calendar-start" onClose={() => { setDataInicio(undefined); handleRefresh(); }}>Início: {dataInicio.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Chip>}
                    {dataFim && <Chip icon="calendar-end" onClose={() => { setDataFim(undefined); handleRefresh(); }}>Fim: {dataFim.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Chip>}
                </View>

                {/* ATENÇÃO: Como o ScreenContainer JÁ É um ScrollView,
                   a FlatList aqui dentro NÃO PODE scrollar sozinha.
                   Usamos scrollEnabled={false} para ela se comportar como uma View normal
                   e deixar o ScreenContainer fazer o trabalho.
                */}
                <FlatList
                    data={pontos}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    scrollEnabled={true} // OBRIGATÓRIO POIS TÁ DENTRO DE OUTRO SCROLL
                    ListFooterComponent={loading && !refreshing ? <ActivityIndicator style={{ margin: 20 }} /> : null}
                    ListEmptyComponent={!loading ? <Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>Nenhum registro encontrado.</Text> : null}
                />
                <View style={{ height: 100 }} /> 
            </ScreenContainer>

            <Surface style={[styles.paginationFooter, footerStyle, { backgroundColor: theme.colors.elevation.level2 }]} elevation={4}>
                <View style={styles.paginationContent}>
                    <IconButton icon="chevron-left" mode="contained-tonal" disabled={page === 1 || loading} onPress={handlePrevPage} size={24} />
                    <View style={styles.pageIndicator}>
                        {loading ? <ActivityIndicator size="small" /> : <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>Página <Text style={{fontWeight:'bold', color: theme.colors.primary}}>{page}</Text> de {totalPages}</Text>}
                    </View>
                    <IconButton icon="chevron-right" mode="contained-tonal" disabled={page === totalPages || totalPages === 0 || loading} onPress={handleNextPage} size={24} />
                </View>
            </Surface>

            {/* --- MODAIS --- */}
            {/* (Mantive seus modais originais aqui) */}

            <Portal>
                <Modal visible={filterModalVisible} onDismiss={() => setFilterModalVisible(false)} contentContainerStyle={{ backgroundColor: theme.colors.background, padding: 20, margin: 20, borderRadius: 12, alignSelf: 'center', width: '90%', maxWidth: 500 }}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}><Text variant="titleLarge">Filtrar Histórico</Text><IconButton icon="close" onPress={() => setFilterModalVisible(false)} /></View>
                    <Text variant="labelLarge" style={styles.label}>Funcionário:</Text>
                    <Button mode="outlined" onPress={() => { setEmployeeModalVisible(true); setSearchQuery(''); setFilteredFuncionarios(funcionarios); }} style={{ marginBottom: 16, borderColor: theme.colors.outline }} contentStyle={{ justifyContent: 'flex-start' }} textColor={selectedFuncionario ? theme.colors.primary : theme.colors.onSurfaceVariant} icon="account-search">{selectedFuncionario ? selectedFuncionario.nome : "Selecionar Funcionário (Todos)"}</Button>
                    <Text variant="labelLarge" style={styles.label}>Período:</Text>
                    <View style={styles.dateContainer}>
                        <View style={styles.dateWrapper}><Text variant="bodySmall" style={{marginBottom:4}}>De:</Text>{Platform.OS === 'web' ? <input type="date" value={dataInicio ? toISODateString(dataInicio) : ''} onChange={(e: any) => { if(!e.target.value) { setDataInicio(undefined); return;} const [year, month, day] = e.target.value.split('-').map(Number); setDataInicio(new Date(Date.UTC(year, month - 1, day))); }} style={{...styles.webInput, backgroundColor: paperTheme.colors.surface, color: paperTheme.colors.onSurface, colorScheme: paperTheme.dark ? 'dark' : 'light' }} /> : <><Button mode="outlined" onPress={() => setShowPickerInicio(true)}>{dataInicio ? dataInicio.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'dd/mm/aaaa'}</Button>{showPickerInicio && (<DateTimePicker value={dataInicio || new Date()} mode="date" display="default" onChange={onChangeDataInicio} />)}</>}</View>
                        <View style={styles.dateWrapper}><Text variant="bodySmall" style={{marginBottom:4}}>Até:</Text>{Platform.OS === 'web' ? <input type="date" value={dataFim ? toISODateString(dataFim) : ''} onChange={(e: any) => { if(!e.target.value) { setDataFim(undefined); return;} const [year, month, day] = e.target.value.split('-').map(Number); setDataFim(new Date(Date.UTC(year, month - 1, day))); }} style={{...styles.webInput, backgroundColor: paperTheme.colors.surface, color: paperTheme.colors.onSurface, colorScheme: paperTheme.dark ? 'dark' : 'light' }} /> : <><Button mode="outlined" onPress={() => setShowPickerFim(true)}>{dataFim ? dataFim.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'dd/mm/aaaa'}</Button>{showPickerFim && (<DateTimePicker value={dataFim || new Date()} mode="date" display="default" onChange={onChangeDataFim} />)}</>}</View>
                    </View>
                    <Divider style={{ marginVertical: 16 }} />
                    <View style={styles.modalActions}><Button onPress={clearAllFilters} textColor={theme.colors.error}>Limpar</Button><Button mode="contained" onPress={applyFilters} style={{ flex: 1, marginLeft: 10 }}>Aplicar Filtros</Button></View>
                </Modal>
            </Portal>
            <DetalhesPontoModal 
                visible={detalhesModalVisible} 
                onDismiss={() => setDetalhesModalVisible(false)} 
                ponto={pontoSelecionado}
                estabelecimento={dadosFuncionario?.estabelecimento}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeFilters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    card: { marginBottom: 10, elevation: 1 },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    leftContent: { flexDirection: 'row', alignItems: 'center' },
    rightContent: { alignItems: 'flex-end' },
    label: { marginBottom: 8, fontWeight: 'bold' },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    dateWrapper: { flex: 1 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    webInput: { padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#ccc', width: '50%', color: '#000' },
    
    // --- ESTILO CORRIGIDO DO RODAPÉ ---
    paginationFooter: { 
        position: 'absolute', 
        bottom: 0, // Cola na parte inferior da tela
        left: 0,
        right: 0, 
        padding: 10, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: -2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 3, 
        elevation: 10 
    },
    paginationContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 400, alignSelf: 'center', width: '100%' },
    pageIndicator: { alignItems: 'center', justifyContent: 'center' },
    
    // Detalhes
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    mapContainer: { height: 250, width: '100%', borderRadius: 12, overflow: 'hidden', marginTop: 10, backgroundColor: '#e0e0e0' },
    noLocationContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }
});