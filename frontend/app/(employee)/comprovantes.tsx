import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Button } from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho se necessário
import api from "@/services/api"; // Sua instância do Axios
import { ComprovanteDto } from '../../models/Dtos/ComprovanteDto'; // Nosso novo tipo
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { set } from 'date-fns';
import Colors from '@/constants/Colors';

// Função helper para formatar a data YYYY-MM-DD
const toISODateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function ComprovanteScreen() {
  const { userId } = useAuth(); // Pegamos o ID do funcionário logado

    // Estado para as datas
    const [dataInicio, setDataInicio] = useState(new Date(new Date().setDate(1))); // Padrão: dia 1 do mês atual
    const [dataFim, setDataFim] = useState(new Date()); // Padrão: hoje

    // Estado para os seletores de data
    const [showPickerInicio, setShowPickerInicio] = useState(false);
    const [showPickerFim, setShowPickerFim] = useState(false);

    // Estado da tela
    const [comprovantes, setComprovantes] = useState<ComprovanteDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mensagem, setMensagem] = useState('');

    // Função para buscar os dados na API
    const fetchComprovantes = async () => {
    const funcionarioId = userId; //Pega o ID do funcionário logado
        if (!funcionarioId) {
            Alert.alert('Erro', 'Não foi possível identificar o funcionário.');
            return;
        }

        setIsLoading(true);
        setMensagem('');
        setComprovantes([]);

        // Formata as datas para a API (YYYY-MM-DD)
        const params = {
            dataInicio: toISODateString(dataInicio),
            dataFim: toISODateString(dataFim),
        };

        try {
            console.log('Buscando comprovantes com params:', params);
            console.log('Funcionário ID:', funcionarioId);
            const response = await api.get(`/RegistroPonto/comprovantes?funcionarioId=${funcionarioId}`, { params });

            if (response.data && response.data.success) {
                setComprovantes(response.data.data);
                if (response.data.data.length === 0) {
                    setMensagem('Nenhum comprovante encontrado para o período selecionado.');
                }
            } else {
                setMensagem(response.data.errorMessage || 'Erro ao buscar dados.');
            }
        } catch (error: any) {
            console.error('Erro ao buscar comprovantes:', error);
            setMensagem('Erro de conexão. Tente novamente.');
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
        setShowPickerInicio(false);
        setDataInicio(currentDate);
    };

    const onChangeDataFim = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || dataFim;
        setShowPickerFim(false);
        setDataFim(currentDate);
    };

    // Função para abrir o link do comprovante
    const abrirComprovante = (url: string) => {
        Linking.openURL(url).catch(err => Alert.alert('Erro', 'Não foi possível abrir o comprovante.'));
    };

    // Renderização do item da lista
    const renderItem = ({ item }: { item: ComprovanteDto }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => abrirComprovante(item.comprovanteUrl)}>
        <View>
            <Text style={styles.itemTipo}>{item.tipo}</Text>
            <Text style={styles.itemData}>
            {new Date(item.timestampMarcacao).toLocaleDateString('pt-BR')} - {new Date(item.timestampMarcacao).toLocaleTimeString('pt-BR')}
            </Text>
        </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Filtrar Período</Text>
        
        {/* Seletores de Data */}
        <View style={styles.pickerContainer}>
            <View style={styles.pickerWrapper}>
            <Text style={styles.label}>Data Início:</Text>
            <Button onPress={() => setShowPickerInicio(true)} title={dataInicio.toLocaleDateString('pt-BR')} />
            {showPickerInicio && (
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toISODateString(dataInicio)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newDate = e.target.value ? new Date(e.target.value) : dataInicio;
                    setShowPickerInicio(false);
                    setDataInicio(newDate);
                  }}
                  style={{ padding: 8 }}
                />
              ) : (
                <DateTimePicker
                  value={dataInicio}
                  mode="date"
                  display="default"
                  onChange={onChangeDataInicio}
                />
              )
            )}
            </View>
            <View style={styles.pickerWrapper}>
            <Text style={styles.label}>Data Fim:</Text>
            <Button onPress={() => setShowPickerFim(true)} title={dataFim.toLocaleDateString('pt-BR')} />
            {showPickerFim && (
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toISODateString(dataFim)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newDate = e.target.value ? new Date(e.target.value) : dataFim;
                    setShowPickerFim(false);
                    setDataFim(newDate);
                  }}
                  style={{ padding: 8 }}
                />
              ) : (
                <DateTimePicker
                  value={dataFim}
                  mode="date"
                  display="default"
                  onChange={onChangeDataFim}
                />
              )
            )}
            </View>
        </View>
        
        {/* O botão de buscar não é mais estritamente necessário se usamos o useFocusEffect,
            mas podemos manter para o usuário "re-buscar" manualmente se desejar */}
        <Button title="Buscar" onPress={fetchComprovantes} disabled={isLoading} />

        {/* Feedback de Carregamento */}
        {isLoading ? (
            <ActivityIndicator size="large" color={Colors.light.tint} style={styles.loader} />
        ) : (
            <FlatList
            data={comprovantes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            ListEmptyComponent={<Text style={styles.mensagemVazio}>{mensagem}</Text>}
            />
        )}
        </View>
    );
}
/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pickerWrapper: {
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  loader: {
    marginTop: 50,
  },
  list: {
    marginTop: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    borderRadius: 8,
  },
  itemTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  itemData: {
    fontSize: 14,
    color: '#555',
  },
  mensagemVazio: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  },
});