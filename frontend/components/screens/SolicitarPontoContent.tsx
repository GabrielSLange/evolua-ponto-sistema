import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Platform, ScrollView, KeyboardAvoidingView, TouchableOpacity, RefreshControl, Modal, useWindowDimensions } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme, HelperText, Card, Chip, Avatar, Divider, FAB, Portal, Modal as PaperModal } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '../../services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { SolicitacaoPontoDto } from '@/models/Dtos/SolicitacaoPontoDto';
import CustomLoader from '../CustomLoader';

export default function SolicitarPontoContent() {
  const router = useRouter();
  const theme = useTheme();
  const { userId } = useAuth();
  
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const { showNotification } = useNotification();

  // --- Estados do Formulário ---
  const [tipo, setTipo] = useState('ENTRADA');
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [justificativa, setJustificativa] = useState('');

  // Controle do Modal do Formulário
  const [modalVisible, setModalVisible] = useState(false);

  // Controle de Erros e Loading
  const [erroJustificativa, setErroJustificativa] = useState(false); // <--- NOVO: Controla o erro visual
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar a visibilidade dos Pickers (Nativo)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // --- NOVO: Estados para Histórico ---
  const [historico, setHistorico] = useState<SolicitacaoPontoDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- Helpers de Data ---
  const getIsoDateForApi = () => {
    return dataSelecionada.toISOString();
  };

  // Função para buscar histórico
  const fetchHistorico = async () => {
    const funcionarioId = userId;
    if (!funcionarioId) {
      showNotification('Não foi possível identificar o funcionário.', 'error');
      return;
    }
    setRefreshing(true);
    setIsLoading(true);
    try {
      const response = await api.get('/RegistroPonto/historico', {
        params: { funcionarioId: funcionarioId }
      });
      if (response.data.success) {
        setHistorico(response.data.data);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico", error);
    }
    finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Carrega dados ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      fetchHistorico();
    }, [])
  );

  // -Pull to Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistorico();
    setRefreshing(false);
  };

  // --- Handlers (Nativo) ---
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const novaData = new Date(dataSelecionada);
      novaData.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDataSelecionada(novaData);
    }
  };

  const onChangeTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const novaData = new Date(dataSelecionada);
      novaData.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setDataSelecionada(novaData);
    }
  };

  // --- Handler (Web) ---
  const onChangeWebDateTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      setDataSelecionada(new Date(event.target.value));
    }
  };

  // --- Envio do Formulário ---
  const handleSubmit = async () => {
    // 1. Validação Visual
    if (!justificativa.trim()) {
      setErroJustificativa(true);
      // Opcional: Avisar também via toast se quiser ser redundante
      // showNotification('A justificativa é obrigatória.', 'error');
      return;
    }

    setErroJustificativa(false);
    setIsLoading(true);

    try {
      const payload = {
        funcionarioId: userId,
        tipo: tipo,
        horario: getIsoDateForApi(),
        justificativa: justificativa
      };

      const response = await api.post('/registroponto/solicitacao', payload);

      if (response.data && response.data.success) {
        // --- SUCESSO ---
        // Mostra o Toast Verde
        showNotification('Solicitação enviada com sucesso!', 'success');

        // Fechar modal, Limpar formulário e atualiza lista
        setJustificativa('');
        setErroJustificativa(false);
        setModalVisible(false);
        fetchHistorico(); // Atualiza a lista lá embaixo 

      } else {
        // --- ERRO DA API ---
        const msg = response.data.errorMessage || 'Não foi possível enviar a solicitação.';
        showNotification(msg, 'error');
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.errorMessage || 'Erro de conexão com o servidor.';
      // --- ERRO DE CONEXÃO ---
      showNotification(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza cada item do histórico
  const renderHistoricoItem = (item: SolicitacaoPontoDto) => {
    const dataItem = new Date(item.timestampMarcacao);

    // Status
    const isPendente = item.status === 0;
    const isAprovado = item.status === 1;
    const isRejeitado = item.status === 2;

    let chipBg = theme.colors.secondaryContainer;
    let chipText = theme.colors.onSecondaryContainer;
    let chipIcon = "clock-outline";
    let statusText = "Pendente";
    let borderColor = theme.colors.outline;

    if (isAprovado) {
      chipBg = 'rgba(40, 167, 69, 0.2)'; // Fundo verde claro
      chipText = '#155724'; // Verde escuro
      chipIcon = "check-circle";
      statusText = "Aceita";
      borderColor = '#28a745';
    } else if (isRejeitado) {
      chipBg = theme.colors.errorContainer;
      chipText = theme.colors.error;
      chipIcon = "alert-circle";
      statusText = "Rejeitada";
      borderColor = theme.colors.error;
    }

    return (
      <Card key={item.id} style={[styles.card, { borderColor: borderColor }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {dataItem.toLocaleDateString('pt-BR')} - {dataItem.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Chip
              icon={chipIcon}
              style={{ backgroundColor: chipBg }}
              textStyle={{ color: chipText }}
            >
              {statusText}
            </Chip>
          </View>

          <Text style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>Tipo: </Text> {item.tipo}
          </Text>
          <Text style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>Sua Justificativa: </Text> {item.justificativaFuncionarioSolicitacao}
          </Text>

          {isRejeitado && item.justificativaAdminSolicitacao && (
            <View style={[styles.rejectionBox, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={{ color: theme.colors.onErrorContainer, fontWeight: 'bold' }}>Motivo da Rejeição:</Text>
              <Text style={{ color: theme.colors.onErrorContainer }}>{item.justificativaAdminSolicitacao}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8 }}>Solicitações de Ponto</Text>
          <Text variant="bodySmall" style={{ marginBottom: 24, color: '#666' }}>
            Acompanhe o status das suas solicitações manuais.
          </Text>

          {historico.length === 0 ? (
            <View style={styles.emptyState}>
              <Avatar.Icon icon="history" size={48} style={{ backgroundColor: theme.colors.surfaceVariant }} />
              <Text style={{ color: '#888', marginTop: 8 }}>Nenhuma solicitação enviada.</Text>
            </View>
          ) : (
            // Exibe as solicitações ordenando pela mais recente (maior ID = última a ser criada)
            [...historico]
              .sort((a, b) => b.id - a.id)
              .map(renderHistoricoItem)
          )}

          <View style={{ height: 80 }} /> {/* Espaço extra para o FAB não cobrir itens */}
        </ScrollView>
      </ScreenContainer>

      <FAB
        icon="plus"
        style={[styles.fab, isDesktop && styles.fabDesktop, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <PaperModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            { backgroundColor: theme.colors.background },
            styles.paperModalWrapper
          ]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Nova Solicitação</Text>
              </View>

              {/* 1. Seleção de Tipo */}
              <View style={styles.inputGroup}>
                <Text variant="titleMedium" style={styles.label}>Tipo de Registro</Text>
                <SegmentedButtons
                  value={tipo}
                  onValueChange={setTipo}
                  buttons={[
                    {
                      value: 'ENTRADA',
                      label: 'Entrada',
                      icon: 'login',
                      style: { backgroundColor: tipo === 'ENTRADA' ? theme.colors.secondaryContainer : undefined },
                    },
                    {
                      value: 'SAIDA',
                      label: 'Saída',
                      icon: 'logout',
                      style: { backgroundColor: tipo === 'SAIDA' ? theme.colors.errorContainer : undefined }
                    },
                  ]}
                />
              </View>

              {/* 2. Seleção de Data e Hora */}
              <View style={styles.inputGroup}>
                <Text variant="titleMedium" style={styles.label}>Data e Hora</Text>

                {Platform.OS === 'web' ? (
                  <input
                    type="datetime-local"
                    value={new Date(dataSelecionada.getTime() - (dataSelecionada.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                    onChange={onChangeWebDateTime}
                    style={{
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 4,
                      border: `1px solid ${theme.colors.outline}`,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.onSurface,
                      colorScheme: theme.dark ? 'dark' : 'light'
                    }}
                  />
                ) : (
                  <View style={styles.row}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowDatePicker(true)}
                      icon="calendar"
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      <Text style={{ fontFamily: 'Nunito_400Regular' }}>{dataSelecionada.toLocaleDateString('pt-BR')}</Text>
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={() => setShowTimePicker(true)}
                      icon="clock-outline"
                      style={{ flex: 1 }}
                    >
                      {dataSelecionada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Button>

                    {showDatePicker && (
                      <DateTimePicker
                        value={dataSelecionada}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                      />
                    )}

                    {showTimePicker && (
                      <DateTimePicker
                        value={dataSelecionada}
                        mode="time"
                        display="default"
                        onChange={onChangeTime}
                      />
                    )}
                  </View>
                )}
              </View>

              {/* 3. Justificativa (COM VALIDAÇÃO VISUAL) */}
              <View style={styles.inputGroup}>
                <Text variant="titleMedium" style={styles.label}>Justificativa</Text>
                <TextInput
                  mode="outlined"
                  placeholder="Ex: Esqueci o celular, estava sem bateria..."
                  value={justificativa}
                  onChangeText={(text) => {
                    setJustificativa(text);
                    if (text.trim()) setErroJustificativa(false); // Limpa o erro enquanto digita
                  }}
                  multiline
                  numberOfLines={4}
                  error={erroJustificativa} // <--- Fica vermelho se houver erro
                  style={{ backgroundColor: theme.colors.surface }}
                />

                {/* O HelperText muda de cor e mensagem dependendo do erro */}
                <HelperText type={erroJustificativa ? 'error' : 'info'} visible={true}>
                  {erroJustificativa
                    ? 'A justificativa é obrigatória.'
                    : 'Descreva brevemente o motivo da solicitação.'}
                </HelperText>
              </View>

              {/* 4. Botões do Footer */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <Button mode="outlined" onPress={() => setModalVisible(false)} disabled={isLoading} style={{ flex: 1, paddingVertical: 6 }}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleSubmit} disabled={isLoading} loading={isLoading} style={{ flex: 1, paddingVertical: 6 }}>
                  Enviar
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </PaperModal>
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
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: "100%",
    padding: 16,
    borderRadius: 10,
    alignItems: "center"
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold"
  },
  divider: {
    marginVertical: 32,
    height: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
    borderLeftWidth: 4, // Tarja colorida na esquerda
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rejectionBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
    opacity: 0.7
  },
  // Novos estilos do FAB e Modal
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  fabDesktop: {
    right: '12%',
  },
  paperModalWrapper: {
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    maxHeight: '90%',
    width: '95%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});