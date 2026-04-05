import React, { useState, useCallback, useMemo } from 'react';
import { View, SectionList, StyleSheet, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { Button, useTheme, Text as PaperText, Text, List, Avatar, Divider, IconButton, Chip, Portal } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho se necessário
import api from "@/services/api"; // Sua instância do Axios
import { ComprovanteDto } from '../../models/Dtos/ComprovanteDto'; // Nosso novo tipo
import { useFocusEffect } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { ComprovanteModal } from '@/components/ComprovanteModal';
import CustomLoader from '../CustomLoader';
import { ScrollView } from 'react-native-gesture-handler';


// Função helper para formatar a data YYYY-MM-DD
const toISODateString = (date?: Date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

// Helper para obter o ícone com base no tipo de marcação
const getIconForType = (type: string) => {
  if (type.startsWith('ENTRADA')) {
    return { icon: 'login-variant', color: '#4CAF50' }; // Verde para entradas
  }
  if (type.startsWith('SAIDA')) {
    return { icon: 'logout-variant', color: '#F44336' }; // Vermelho para saídas
  }
  return { icon: 'clock-outline', color: '#607D8B' }; // Padrão
};

const EmptyState = ({ message }: { message: string }) => (
  <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 20 }}>
    <Avatar.Icon icon="file-document-outline" size={80} style={{ backgroundColor: 'transparent' }} />
    <PaperText style={{ textAlign: 'center', marginTop: 16, fontSize: 16, color: '#777' }}>{message}</PaperText>
  </View>
);

export default function ComprovantesContent() {
  const { userId } = useAuth(); // Pegamos o ID do funcionário logado e o tema
  const theme = useTheme();

  // Cria os estilos dinamicamente com base no tema
  const styles = getStyles(theme);

  // Estado para as datas - Inicializando em UTC para evitar problemas de fuso horário
  const hoje = new Date();
  const inicioDoMes = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), 1));
  const hojeUtc = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

  const [dataInicio, setDataInicio] = useState<Date | undefined>(inicioDoMes); // Padrão: dia 1 do mês atual em UTC
  const [dataFim, setDataFim] = useState<Date | undefined>(hojeUtc); // Padrão: hoje em UTC

  // Estado para os seletores de data
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  // Estado da tela
  const [comprovantes, setComprovantes] = useState<ComprovanteDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os dados na API
  const fetchComprovantes = async () => {
    const funcionarioId = userId; //Pega o ID do funcionário logado
    if (!funcionarioId) {
      Alert.alert('Erro', 'Não foi possível identificar o funcionário.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setComprovantes([]);

    try {
      const response = await api.get('/Comprovante', {
        params: {
          funcionarioId: funcionarioId,
          dataInicio: dataInicio ? toISODateString(dataInicio) : null,
          dataFim: dataFim ? toISODateString(dataFim) : null,
        }
      });

      if (response.data && response.data.success) {
        setComprovantes(response.data.data);
      } else {
        setError(response.data.errorMessage || 'Erro ao buscar dados.');
      }
    } catch (error: any) {
      console.error('Erro ao buscar comprovantes:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Busca os dados quando a tela é focada (ao abrir)
  useFocusEffect(
    useCallback(() => {
      fetchComprovantes();
    }, [dataInicio, dataFim, userId]) // Recarrega se as datas ou o userId mudarem
  );

  // Funções para os DatePickers
  const onChangeDataInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dataInicio;
    setShowPickerInicio(Platform.OS === 'ios'); // No Android, o picker se fecha sozinho
    if (currentDate) {
      // Garante que a data selecionada seja tratada como UTC
      const newDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
      setDataInicio(newDate);
    }
  };

  const onChangeDataFim = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dataFim;
    setShowPickerFim(Platform.OS === 'ios');
    if (currentDate) {
      const newDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
      setDataFim(newDate);
    }
  };

  // Função para abrir o link do comprovante
  const abrirComprovante = (url: string) => {
    if (!url) {
      Alert.alert('Aviso', 'Comprovante ainda não disponível.');
      return;
    }
    setSelectedUrl(url); // Salva a URL assinada
    setModalVisible(true); // Abre o Modal
  };

  // 1. Agrupa os comprovantes por dia usando useMemo para otimização
  const groupedComprovantes = useMemo(() => {
    const groups: { [key: string]: ComprovanteDto[] } = {};

    comprovantes.forEach(comprovante => {
      const dateKey = new Date(comprovante.timestampMarcacao).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(comprovante);
    });

    // Transforma o objeto em um array que o SectionList entende
    return Object.keys(groups).map(date => ({
      title: date,
      data: groups[date],
    }));
  }, [comprovantes]);

  // Renderização do item da lista
  const renderItem = ({ item }: { item: ComprovanteDto }) => (
    <List.Item
      title={item.tipo.replace(/_/g, ' ')}
      titleStyle={styles.itemTipo}
      right={() => (
        <PaperText style={styles.itemData}>
          {new Date(item.timestampMarcacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </PaperText>
      )}
      left={() => <Avatar.Icon size={40} icon={getIconForType(item.tipo).icon} color={getIconForType(item.tipo).color} style={{ backgroundColor: 'transparent' }} />}
      onPress={() => abrirComprovante(item.comprovanteUrl)}
      style={styles.itemContainer}
    />
  );

  const renderEmptyList = () => {
    if (isLoading) return null; // Não mostra nada se estiver carregando
    if (error) {
      return <EmptyState message={error} />;
    }
    return <EmptyState message="Nenhum comprovante encontrado para o período selecionado." />;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ backgroundColor: theme.colors.background }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Meus Comprovantes</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Visualize seus comprovantes de ponto.
              </Text>
            </View>
            <IconButton icon="filter-variant" mode="contained" onPress={() => setFilterModalVisible(true)} />
          </View>

          <Divider style={{ marginHorizontal: 16, marginBottom: 16, marginTop: 8 }} />

          <View style={styles.activeFilters}>
            {dataInicio && <Chip icon="calendar-start" onClose={() => { setDataInicio(undefined); }}>Início: {dataInicio.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Chip>}
            {dataFim && <Chip icon="calendar-end" onClose={() => { setDataFim(undefined); }}>Fim: {dataFim.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Chip>}
          </View>

          {/* O botão de busca foi removido pois a busca é automática ao mudar as datas */}

          {/* Feedback de Carregamento */}
          {!isLoading ? (
            <SectionList
              sections={groupedComprovantes}
              renderItem={renderItem}
              keyExtractor={(item, index) => item.id.toString() + index}
              style={styles.list}
              ListEmptyComponent={renderEmptyList}
              renderSectionHeader={({ section: { title } }) => <PaperText style={styles.sectionHeader}>{title}</PaperText>}
              stickySectionHeadersEnabled={false}
            />
          ) : null}

          <ComprovanteModal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            pdfUrl={selectedUrl}
          />

          <Portal>
            <Modal visible={filterModalVisible} onDismiss={() => setFilterModalVisible(false)} transparent={true} animationType="fade">
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: theme.colors.background,
                  padding: 20,
                  margin: 20,
                  borderRadius: 12,
                  width: '90%',
                  maxWidth: 500
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><Text variant="titleLarge">Filtrar Comprovantes</Text><IconButton icon="close" onPress={() => setFilterModalVisible(false)} /></View>
                  <Text variant="labelLarge" style={styles.label}>Período:</Text>
                  <View style={styles.dateContainer}>
                    <View style={styles.dateWrapper}><Text variant="bodySmall" style={{ marginBottom: 4 }}>De:</Text>{Platform.OS === 'web' ? <input type="date" value={dataInicio ? toISODateString(dataInicio) : ''} onChange={(e: any) => { if (!e.target.value) { setDataInicio(undefined); return; } const [year, month, day] = e.target.value.split('-').map(Number); setDataInicio(new Date(Date.UTC(year, month - 1, day))); }} style={{ ...styles.webDatePicker, backgroundColor: theme.colors.surface, color: theme.colors.onSurface, colorScheme: theme.dark ? 'dark' : 'light' }} /> : <><Button mode="outlined" onPress={() => setShowPickerInicio(true)}>{dataInicio ? dataInicio.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'dd/mm/aaaa'}</Button>{showPickerInicio && (<DateTimePicker value={dataInicio || new Date()} mode="date" display="default" onChange={onChangeDataInicio} />)}</>}</View>
                    <View style={styles.dateWrapper}><Text variant="bodySmall" style={{ marginBottom: 4 }}>Até:</Text>{Platform.OS === 'web' ? <input type="date" value={dataFim ? toISODateString(dataFim) : ''} onChange={(e: any) => { if (!e.target.value) { setDataFim(undefined); return; } const [year, month, day] = e.target.value.split('-').map(Number); setDataFim(new Date(Date.UTC(year, month - 1, day))); }} style={{ ...styles.webDatePicker, backgroundColor: theme.colors.surface, color: theme.colors.onSurface, colorScheme: theme.dark ? 'dark' : 'light' }} /> : <><Button mode="outlined" onPress={() => setShowPickerFim(true)}>{dataFim ? dataFim.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'dd/mm/aaaa'}</Button>{showPickerFim && (<DateTimePicker value={dataFim || new Date()} mode="date" display="default" onChange={onChangeDataFim} />)}</>}</View>
                  </View>
                  <Divider style={{ marginVertical: 16 }} />
                  <View style={styles.modalActions}>
                    <Button onPress={() => { setDataInicio(undefined); setDataFim(undefined); setFilterModalVisible(false); }} textColor={theme.colors.error}>Limpar</Button>
                    <Button mode="contained" onPress={() => setFilterModalVisible(false)} style={{ flex: 1, marginLeft: 10 }}>Aplicar Filtros</Button>
                  </View>
                </View>
              </View>
            </Modal>
          </Portal>

          <Modal
            transparent={true}
            animationType="fade"
            visible={isLoading}
          >
            <View style={styles.loaderOverlay}>
              <CustomLoader />
            </View>
          </Modal>

        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
/* ---------- styles ---------- */
const getStyles = (theme: any) => StyleSheet.create({
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  activeFilters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, flexWrap: 'wrap' },
  dateContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  dateWrapper: { flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  label: {

    marginBottom: 8,
  },
  loader: {
    marginTop: 50,
  },
  list: {
    marginHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceVariant,
    marginTop: 12,
    borderRadius: 4,
  },
  itemContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  itemTipo: {
    textTransform: 'capitalize',
    fontSize: 16,
    marginLeft: -8, // Ajuste fino para alinhar com o ícone
  },
  itemData: {
    fontSize: 14,
    alignSelf: 'center', // Centraliza o texto do horário verticalmente
  },
  webDatePicker: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Escureci um pouco mais para contraste em telas claras
    alignItems: 'center',
    justifyContent: 'center',
  },
});