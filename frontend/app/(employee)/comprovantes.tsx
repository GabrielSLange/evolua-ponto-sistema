import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, SectionList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, Text } from 'react-native';
import { Button, useTheme, Text as PaperText, List, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho se necessário
import api from "@/services/api"; // Sua instância do Axios
import { ComprovanteDto } from '../../models/Dtos/ComprovanteDto'; // Nosso novo tipo
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ScreenContainer from '@/components/layouts/ScreenContainer';


// Função helper para formatar a data YYYY-MM-DD
const toISODateString = (date: Date) => {
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

export default function ComprovanteScreen() {
  const { userId, theme } = useAuth(); // Pegamos o ID do funcionário logado e o tema
  const paperTheme = useTheme();

  // Cria os estilos dinamicamente com base no tema
  const styles = getStyles(paperTheme);

  // Estado para as datas - Inicializando em UTC para evitar problemas de fuso horário
  const hoje = new Date();
  const inicioDoMes = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), 1));
  const hojeUtc = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));

  const [dataInicio, setDataInicio] = useState(inicioDoMes); // Padrão: dia 1 do mês atual em UTC
  const [dataFim, setDataFim] = useState(hojeUtc); // Padrão: hoje em UTC

  // Estado para os seletores de data
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);

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
      const response = await api.get('/RegistroPonto/comprovantes', {
        params: {
          funcionarioId: funcionarioId,
          dataInicio: toISODateString(dataInicio),
          dataFim: toISODateString(dataFim),
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
    Linking.openURL(url).catch(err => Alert.alert('Erro', 'Não foi possível abrir o comprovante.'));
  };

  // 1. Agrupa os comprovantes por dia usando useMemo para otimização
  const groupedComprovantes = useMemo(() => {
    const groups: { [key: string]: ComprovanteDto[] } = {};

    comprovantes.forEach(comprovante => {
      // Usamos toLocaleDateString com UTC para garantir que a data não mude com o fuso horário
      const dateKey = new Date(comprovante.timestampMarcacao).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
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
    <ScreenContainer>
      <View style={styles.container}>
        <PaperText variant="headlineSmall" style={styles.title}>Filtrar Período</PaperText>

        <List.Accordion
          title="Filtros"
          left={props => <List.Icon {...props} icon="filter-variant" />}
          style={styles.accordion}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
              <PaperText style={styles.label}>Data Início:</PaperText>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toISODateString(dataInicio)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setDataInicio(new Date(Date.UTC(year, month - 1, day)));
                  }}
                  style={{ ...styles.webDatePicker, backgroundColor: paperTheme.colors.surface, color: paperTheme.colors.onSurface }}
                />
              ) : (
                <>
                  <Button mode="outlined" onPress={() => setShowPickerInicio(true)}>{dataInicio.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Button>
                  {showPickerInicio && (
                    <DateTimePicker
                      value={dataInicio}
                      mode="date"
                      display="default"
                      onChange={onChangeDataInicio}
                    />
                  )}
                </>
              )}
            </View>
            <View style={styles.pickerWrapper}>
              <PaperText style={styles.label}>Data Fim:</PaperText>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toISODateString(dataFim)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setDataFim(new Date(Date.UTC(year, month - 1, day)));
                  }}
                  style={{ ...styles.webDatePicker, backgroundColor: paperTheme.colors.surface, color: paperTheme.colors.onSurface }}
                />
              ) : (
                <>
                  <Button mode="outlined" onPress={() => setShowPickerFim(true)}>{dataFim.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</Button>
                  {showPickerFim && (
                    <DateTimePicker
                      value={dataFim}
                      mode="date"
                      display="default"
                      onChange={onChangeDataFim}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </List.Accordion>

        {/* O botão de busca foi removido pois a busca é automática ao mudar as datas */}

        {/* Feedback de Carregamento */}
        {isLoading && comprovantes.length === 0 ? (
          <ActivityIndicator size="large" color={paperTheme.colors.primary} style={styles.loader} />
        ) : (
          <SectionList
            sections={groupedComprovantes}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id.toString() + index}
            style={styles.list}
            ListEmptyComponent={renderEmptyList}
            renderSectionHeader={({ section: { title } }) => <PaperText style={styles.sectionHeader}>{title}</PaperText>}
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
/* ---------- styles ---------- */
const getStyles = (paperTheme: any) => StyleSheet.create({
    container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  accordion: {
    backgroundColor: paperTheme.colors.surfaceVariant,
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: 'center',
  },
  label: {
    marginBottom: 8,
  },
  loader: {
    marginTop: 50,
  },
  list: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: paperTheme.colors.surfaceVariant,
    marginTop: 12,
    borderRadius: 4,
  },
  itemContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: paperTheme.colors.outlineVariant,
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
});