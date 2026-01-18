import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Alert, ScrollView } from 'react-native';
import { Text, RadioButton, Button, useTheme, Divider, Card, Avatar } from 'react-native-paper'; // Adicionei Avatar para usar icones customizados se quiser
import { useFocusEffect } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import { Fieldset } from '@/components/layouts/FieldSet';
import { SearchableDropdown } from '@/components/layouts/SearchableDropdown';
import { useNotification } from '@/contexts/NotificationContext';
import CustomLoader from '@/components/CustomLoader';
import api from '@/services/api';
import { relatorios } from '@/hooks/admin/useRelatorios';
import { MultiSelectDropdown } from '@/components/layouts/MultiSelectDropdown';

// --- MUDANÇA 1: Adicionado o tipo EXCEL na lista ---
const REPORT_TYPES = [
  { 
    id: 'ESPELHO', 
    label: 'Espelho de Ponto (PDF)', 
    description: 'Relatório individual ou em lote (ZIP) com assinatura.',
    icon: 'file-pdf-box'
  },
  { 
    id: 'EXCEL', 
    label: 'Espelho de Ponto (Excel)', 
    description: 'Planilha (.xlsx) com abas separadas por funcionário.',
    icon: 'file-excel' // Ícone de Excel
  },
  { 
    id: 'AFD', 
    label: 'Arquivo Fiscal - AFD (.txt)', 
    description: 'Auditoria Fiscal (Portaria 671) - Assinado digitalmente.',
    icon: 'file-code'
  },
  { 
    id: 'AEJ', 
    label: 'Arquivo Eletrônico - AEJ (.txt)', 
    description: 'Para tribunais trabalhistas (Assinado .p7s).',
    icon: 'file-document-outline'
  },
];

const MONTHS = [
  { id: '1', name: 'Janeiro' }, { id: '2', name: 'Fevereiro' }, { id: '3', name: 'Março' },
  { id: '4', name: 'Abril' }, { id: '5', name: 'Maio' }, { id: '6', name: 'Junho' },
  { id: '7', name: 'Julho' }, { id: '8', name: 'Agosto' }, { id: '9', name: 'Setembro' },
  { id: '10', name: 'Outubro' }, { id: '11', name: 'Novembro' }, { id: '12', name: 'Dezembro' }
];

export default function RelatoriosScreen() {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { loading, funcionarios, estabelecimentoId, SetLoading } = relatorios();
  
  const [selectedMonthStart, setSelectedMonthStart] = useState(String(new Date().getMonth() + 1));
  const [selectedMonthEnd, setSelectedMonthEnd] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  const [reportType, setReportType] = useState<string>('ESPELHO');
  const [employees, setEmployees] = useState<{ id: string, nome: string }[]>([]);

  const fetchEmployees = useCallback(async () => {
    try { 
      if (funcionarios) {
        setEmployees(funcionarios.map((f: any) => ({ id: f.id, nome: f.nome })));
      }
    } catch (error) {
      console.error("Erro ao buscar funcionários", error);
    }
    finally { SetLoading(false); }
  }, [funcionarios]);

  useFocusEffect(
    useCallback(() => { fetchEmployees(); }, [fetchEmployees])
  );

  const getPeriodo = () => {
    const year = parseInt(selectedYear);
    const startM = parseInt(selectedMonthStart);
    let endM = parseInt(selectedMonthEnd);

    if (endM < startM) {
      endM = startM;
    }

    const dataInicio = new Date(year, startM - 1, 1);
    const dataFim = new Date(year, endM, 0); 

    return {
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      ano: year,
      mesInicio: startM,
      mesFim: endM
    };
  };

  const handleDownload = async () => {
    if (!reportType) return;

    SetLoading(true);
    const periodo = getPeriodo();

    try {
      let response;
      let fileName = `Relatorio_${reportType}_${periodo.mesInicio}_a_${periodo.mesFim}-${selectedYear}`;

      // --- Lógica para ESPELHO DE PONTO (PDF ou ZIP) ---
      if (reportType === 'ESPELHO') {
        if (selectedEmployeeIds.length === 1) {
          const unicoId = selectedEmployeeIds[0];
          const funcNome = employees.find(e => e.id === unicoId)?.nome || 'Funcionario';
          fileName += `_${funcNome}.pdf`;
          
          response = await api.get(`/relatorios/espelho-ponto/${unicoId}`, {
            params: { ano: periodo.ano, mesInicio: periodo.mesInicio, mesFim: periodo.mesFim },
            responseType: 'blob'
          });
        } else {
          fileName += `_Lote.zip`;
          let idsParaEnviar = selectedEmployeeIds;
          if (idsParaEnviar.length === 0) {
             idsParaEnviar = employees.map(e => e.id);
          }
          
          response = await api.post(`/relatorios/espelho-ponto/lote`, {
             funcionariosIds: idsParaEnviar,
             ano: periodo.ano,
             mesInicio: periodo.mesInicio,
             mesFim: periodo.mesFim
          }, { responseType: 'blob' });
        }
      } 
      // --- MUDANÇA 2: Lógica para EXCEL (.xlsx) ---
      else if (reportType === 'EXCEL') {
        fileName += `.xlsx`;

        let idsParaEnviar = selectedEmployeeIds;
        if (idsParaEnviar.length === 0) {
           // Se vazio, pegamos todos
           idsParaEnviar = employees.map(e => e.id);
        }

        // Chamada para o endpoint que criamos anteriormente
        // Nota: O Excel geralmente é mensal, estamos mandando o mêsInicio como referência
        response = await api.post(`/relatorios/excel-em-lote`, {
           funcionariosIds: idsParaEnviar,
           ano: periodo.ano,
           MesInicio: periodo.mesInicio,
           MesFim: periodo.mesFim, // Excel Service espera um mês único por enquanto
        }, { responseType: 'blob' });

      }
      // --- Lógica para FISCAIS (AFD/AEJ) ---
      else if (reportType === 'AFD' || reportType === 'AEJ') {
        const endpoint = reportType === 'AFD' ? '/relatorios/afd' : '/relatorios/aej';
        fileName += `.${reportType}.zip`;

        response = await api.get(endpoint, {
          params: {
            estabelecimentoId: estabelecimentoId, 
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim
          },
          responseType: 'blob'
        });
      }

      // --- Processamento do Download ---
      if (Platform.OS === 'web') {
        if(response !== undefined) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          showNotification("Download concluído com sucesso!", "success");
        }
      } else {
        Alert.alert("Sucesso", "Arquivo gerado. Verifique sua pasta de downloads.");
      }

    } catch (error: any) {
      console.error("Erro no download:", error);
      const msgErro = error.response?.data && error.response.data instanceof Blob 
          ? "Erro ao gerar arquivo (verifique logs do servidor)" // Blobs não mostram texto de erro fácil
          : "Falha ao conectar com o servidor.";
      
      showNotification(`Erro: ${msgErro}`, "error");
    } finally {
      SetLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
          Central de Relatórios
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Selecione os filtros e o formato desejado para exportação.
        </Text>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      {/* --- ETAPA 1: FILTROS --- */}
      <Fieldset legend="1. Período e Abrangência">
        <View style={{ marginBottom: 12 }}>
            <SearchableDropdown
                label="Ano de Referência"
                options={['2024', '2025', '2026']}
                onSelect={setSelectedYear}
                value={selectedYear}
                textoVazio="Selecione o ano"
            />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <SearchableDropdown
              label="Mês Inicial"
              options={MONTHS.map(m => m.name)}
              onSelect={(name) => {
                const found = MONTHS.find(m => m.name === name);
                if (found) setSelectedMonthStart(found.id);
              }}
              value={MONTHS.find(m => m.id === selectedMonthStart)?.name || ''}
              textoVazio="Início"
            />
          </View>

          <View style={{ flex: 1 }}>
            <SearchableDropdown
              label="Mês Final"
              options={MONTHS.map(m => m.name)}
              onSelect={(name) => {
                const found = MONTHS.find(m => m.name === name);
                if (found) setSelectedMonthEnd(found.id);
              }}
              value={MONTHS.find(m => m.id === selectedMonthEnd)?.name || ''}
              textoVazio="Fim"
            />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <MultiSelectDropdown
            label="Funcionários"
            placeholder="Todos os funcionários"
            items={employees}
            selectedIds={selectedEmployeeIds}
            onSave={(newIds) => setSelectedEmployeeIds(newIds)}
          />
          <Text style={{ fontSize: 12, color: theme.colors.outline, marginTop: 4 }}>
             * Deixe vazio para gerar de todos, ou selecione específicos.
          </Text>
      </View>
      </Fieldset>

      {/* --- ETAPA 2: TIPO DE RELATÓRIO --- */}
      <Fieldset legend="2. Tipo de Relatório">
        <RadioButton.Group onValueChange={value => setReportType(value)} value={reportType}>
          {REPORT_TYPES.map((type) => (
            <Card 
              key={type.id} 
              style={[
                styles.reportCard, 
                reportType === type.id && { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: theme.colors.elevation.level1 }
              ]}
              onPress={() => setReportType(type.id)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value={type.id} />
                  <Avatar.Icon 
                    size={40} 
                    icon={type.icon} 
                    style={{ backgroundColor: 'transparent', marginHorizontal: 8 }} 
                    color={reportType === type.id ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={{ fontWeight: reportType === type.id ? 'bold' : 'normal' }}>
                        {type.label}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {type.description}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </RadioButton.Group>
      </Fieldset>

      {/* --- ETAPA 3: AÇÃO --- */}
      <View style={styles.actionContainer}>
        <Button 
          mode="contained" 
          icon="download"
          onPress={handleDownload}
          disabled={loading}
          contentStyle={{ height: 50 }}
        >
          {loading ? "Gerando Arquivo..." : "Gerar e Baixar Relatório"}
        </Button>
      </View>

      {loading && <CustomLoader/>} 

      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  reportCard: {
    marginBottom: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  actionContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  container: {
    padding: 16,
  }
});