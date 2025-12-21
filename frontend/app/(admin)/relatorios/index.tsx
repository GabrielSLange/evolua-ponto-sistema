import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Text, RadioButton, Button, useTheme, Divider, Card } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import { Fieldset } from '@/components/layouts/FieldSet';
import { SearchableDropdown } from '@/components/layouts/SearchableDropdown';
import { useNotification } from '@/contexts/NotificationContext'; // Supondo que você tenha
import CustomLoader from '@/components/CustomLoader';
import api from '@/services/api';
import { relatorios } from '@/hooks/admin/useRelatorios';
import { MultiSelectDropdown } from '@/components/layouts/MultiSelectDropdown';

// Definição dos Tipos de Relatório (Fácil de expandir depois)
const REPORT_TYPES = [
  { 
    id: 'ESPELHO', 
    label: 'Espelho de Ponto (PDF)', 
    description: 'Relatório individual ou em lote (ZIP) com assinatura.',
    icon: 'file-pdf-box'
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
    icon: 'file-document-outline' // Ícone diferente para distinguir
  },
];

// Lista de Meses para o Filtro
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
  
  // --- Estados dos Filtros ---
  const [selectedMonthStart, setSelectedMonthStart] = useState(String(new Date().getMonth() + 1));
  const [selectedMonthEnd, setSelectedMonthEnd] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  // --- Estado do Tipo de Relatório ---
  const [reportType, setReportType] = useState<string>('ESPELHO');

  // --- Estados de Dados e Loading ---
  const [employees, setEmployees] = useState<{ id: string, nome: string }[]>([]);

  // 1. Busca Funcionários para o Dropdown
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

  // 2. A Lógica de Download (Onde a mágica acontece)
  const getPeriodo = () => {
    const year = parseInt(selectedYear);
    const startM = parseInt(selectedMonthStart);
    let endM = parseInt(selectedMonthEnd);

    // Validação simples: Se o usuário escolher Fim menor que Início, forçamos serem iguais
    if (endM < startM) {
      endM = startM;
    }

    const dataInicio = new Date(year, startM - 1, 1);
    // O dia 0 do mês seguinte ao endM pega o último dia do mês endM
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
        
        // CENÁRIO 1: Selecionou APENAS UM funcionário (Gera PDF Individual)
        if (selectedEmployeeIds.length === 1) {
          const unicoId = selectedEmployeeIds[0];
          const funcNome = employees.find(e => e.id === unicoId)?.nome || 'Funcionario';
          
          fileName += `_${funcNome}.pdf`;
          
          response = await api.get(`/relatorios/espelho-ponto/${unicoId}`, {
            params: { ano: periodo.ano, mesInicio: periodo.mesInicio, mesFim: periodo.mesFim },
            responseType: 'blob'
          });
        } 
        // CENÁRIO 2: Selecionou VÁRIOS ou NENHUM (Gera ZIP em Lote)
        else {
          fileName += `_Lote.zip`;
          
          // Se o array estiver vazio, assumimos TODOS. 
          // Se tiver itens, mandamos apenas os selecionados.
          let idsParaEnviar = selectedEmployeeIds;

          if (idsParaEnviar.length === 0) {
             // Se vazio, pegamos todos da lista carregada
             idsParaEnviar = employees.map(e => e.id);
          }
          
          response = await api.post(`/relatorios/espelho-ponto/lote`, {
             funcionariosIds: idsParaEnviar, // Agora mandamos a lista filtrada ou completa
             ano: periodo.ano,
             mesInicio: periodo.mesInicio,
             mesFim: periodo.mesFim
          }, { responseType: 'blob' });
        }
      } 
      // --- Lógica para FISCAIS (AFD/AEJ) ---
      else if (reportType === 'AFD' || reportType === 'AEJ') {
        const endpoint = reportType === 'AFD' ? '/relatorios/afd' : '/relatorios/aej';
        fileName += `.${reportType}.zip`;

        response = await api.get(endpoint, {
          params: {
            estabelecimentoId: estabelecimentoId, 
            dataInicio: periodo.dataInicio, // Já calculados corretamente no helper
            dataFim: periodo.dataFim
          },
          responseType: 'blob'
        });
      }

      // --- Processamento do Download (Igual ao seu anterior) ---
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
        // Lógica Mobile aqui (expo-file-system)
        Alert.alert("Sucesso", "Arquivo gerado. Verifique sua pasta de downloads.");
      }

    } catch (error: any) {
      console.error("Erro no download:", error);
      const msgErro = error.response?.data ? await error.response.data.text() : "Falha ao conectar com o servidor.";
      showNotification(`Erro: ${msgErro}`, "error");
    } finally {
      SetLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
          Central de Relatórios
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Selecione os filtros e o formato desejado para exportação.
        </Text>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      {/* --- ETAPA 1: FILTROS (CONTEXTO) --- */}
      <Fieldset legend="1. Período e Abrangência">
        
        {/* Linha 1: Seleção do Ano */}
        <View style={{ marginBottom: 12 }}>
            <SearchableDropdown
                label="Ano de Referência"
                options={['2024', '2025', '2026']}
                onSelect={setSelectedYear}
                value={selectedYear}
                textoVazio="Selecione o ano"
            />
        </View>

        {/* Linha 2: Mês Início e Mês Fim (Lado a Lado) */}
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

        {/* Linha 3: Funcionário */}
        <View style={{ marginTop: 12 }}>
          <MultiSelectDropdown
            label="Funcionários"
            placeholder="Todos os funcionários"
            items={employees} // Passa a lista completa {id, nome}
            selectedIds={selectedEmployeeIds} // Passa o array de IDs
            onSave={(newIds) => {
                setSelectedEmployeeIds(newIds);
            }}
          />
          <Text style={{ fontSize: 12, color: theme.colors.outline, marginTop: 4 }}>
             * Deixe vazio para gerar de todos, ou selecione específicos para filtrar.
          </Text>
      </View>
      </Fieldset>

      {/* --- ETAPA 2: TIPO DE RELATÓRIO (MODELO) --- */}
      <Fieldset legend="2. Tipo de Relatório">
        <RadioButton.Group onValueChange={value => setReportType(value)} value={reportType}>
          {REPORT_TYPES.map((type) => (
            <Card 
              key={type.id} 
              style={[
                styles.reportCard, 
                reportType === type.id && { borderColor: theme.colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setReportType(type.id)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value={type.id} />
                  <View style={{ marginLeft: 8 }}>
                    <Text variant="titleMedium">{type.label}</Text>
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

      {/* --- ETAPA 3: AÇÃO (DOWNLOAD) --- */}
      <View style={styles.actionContainer}>
        <Button 
          mode="contained" 
          icon="download"
          onPress={handleDownload}
          loading={loading}
          disabled={loading}
          contentStyle={{ height: 56 }}
          style={{ borderRadius: 8 }}
        >
          {loading ? 'Processando e Baixando...' : 'GERAR E BAIXAR RELATÓRIO'}
        </Button>
      </View>

      {/* --- LOADING GLOBAL --- */}
      {loading && <CustomLoader/>} 

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
  },
  actionContainer: {
    marginTop: 24,
    marginBottom: 40,
  }
});