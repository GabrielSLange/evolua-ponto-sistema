import React, { useState } from 'react';
import { View, StyleSheet, Platform, Alert, ScrollView, KeyboardAvoidingView, TouchableOpacity} from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme, HelperText } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '../../services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';

export default function SolicitarPontoScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const theme = useTheme();
  const { showNotification } = useNotification();

  // --- Estados do Formulário ---
  const [tipo, setTipo] = useState('ENTRADA');
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [justificativa, setJustificativa] = useState('');
  
  // Controle de Erros e Loading
  const [erroJustificativa, setErroJustificativa] = useState(false); // <--- NOVO: Controla o erro visual
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar a visibilidade dos Pickers (Nativo)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // --- Helpers de Data ---
  const getIsoDateForApi = () => {
    return dataSelecionada.toISOString();
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
        
        // Volta para a tela anterior
        router.back(); 
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

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text variant="headlineMedium" style={styles.title}>Solicitar Ajuste</Text>

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
                  icon: 'login-variant',
                  style: { borderColor: theme.colors.primary }
                },
                {
                  value: 'SAIDA',
                  label: 'Saída',
                  icon: 'logout-variant',
                  style: { borderColor: theme.colors.error } 
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
                  color: theme.colors.onSurface
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
                  {dataSelecionada.toLocaleDateString('pt-BR')}
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

          {/* 4. Botão de Enviar */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary}
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
        >
            <Text style={[
                styles.buttonText, 
                { color:theme.colors.onPrimary}
            ]}>
                Enviar Solicitação
            </Text>
        </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
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
   }
});