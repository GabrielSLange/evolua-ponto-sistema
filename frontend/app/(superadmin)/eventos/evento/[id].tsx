import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, Card, Avatar, useTheme, Searchbar, Button, Appbar, Chip, Portal, Dialog, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useNotification } from '@/contexts/NotificationContext';
import { isAxiosError } from 'axios';

interface Aluno {
   id: string;
   nomeAluno: string;
   numeroCarteira: string;
   curso: string;
   sala: string;
   bloco: string;
   presente: boolean;
   dataHoraCheckin: string | null;
}

export default function ListaPresencaScreen() {
   const theme = useTheme();
   const router = useRouter();
   const { id } = useLocalSearchParams();
   const { showNotification } = useNotification();

   const [alunos, setAlunos] = useState<Aluno[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [processandoId, setProcessandoId] = useState<string | null>(null);

   // Estados para o Dialog
   const [dialogVisible, setDialogVisible] = useState(false);
   const [alunoParaConfirmar, setAlunoParaConfirmar] = useState<Aluno | null>(null);

   const fetchAlunos = async () => {
      try {
         const response = await api.get(`api/Eventos/${id}/alunos`);
         setAlunos(response.data);
      } catch (error) {
         console.error("Erro ao buscar alunos:", error);
         showNotification("Erro ao carregar a lista de presença.", "error");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (id) fetchAlunos();
   }, [id]);

   const abrirConfirmacao = (aluno: Aluno) => {
      setAlunoParaConfirmar(aluno);
      setDialogVisible(true);
   };

   const fecharDialog = () => {
      setDialogVisible(false);
      setAlunoParaConfirmar(null);
   };

   const executarCheckin = async () => {
      if (!alunoParaConfirmar) return;
      
      const inscricaoId = alunoParaConfirmar.id;
      const nome = alunoParaConfirmar.nomeAluno;

      fecharDialog();
      setProcessandoId(inscricaoId);
      
      try {
         const response = await api.put(`api/Eventos/inscricao/${inscricaoId}/presenca`);
         
         setAlunos(prev => prev.map(aluno => 
            aluno.id === inscricaoId 
               ? { ...aluno, presente: true, dataHoraCheckin: response.data.horario } 
               : aluno
         ));

         showNotification(`Presença confirmada: ${nome.split(' ')[0]}`, "success");
      } catch (error) {
         if (isAxiosError(error) && error.response) {
            showNotification(error.response.data?.erro || "Erro ao registrar presença.", "error");
         }
      } finally {
         setProcessandoId(null);
      }
   };

   const filteredAlunos = useMemo(() => {
      if (!searchQuery) return alunos;
      const lowerQuery = searchQuery.toLowerCase();
      return alunos.filter(a => 
         a.nomeAluno?.toLowerCase().includes(lowerQuery) ||
         a.numeroCarteira?.includes(lowerQuery) ||
         a.sala?.toLowerCase().includes(lowerQuery)
      );
   }, [alunos, searchQuery]);

   const totalAlunos = alunos.length;
   const totalPresentes = alunos.filter(a => a.presente).length;

   const renderAluno = ({ item }: { item: Aluno }) => {
      const isPresente = item.presente;

      return (
         <Card style={[styles.card, isPresente && { backgroundColor: theme.colors.elevation.level2 }]}>
            <Card.Content style={styles.cardContent}>
               <View style={styles.infoContainer}>
                  <Avatar.Text 
                     size={46} 
                     label={item.nomeAluno ? item.nomeAluno.substring(0, 2).toUpperCase() : 'AL'} 
                     style={{ backgroundColor: isPresente ? theme.colors.primary : theme.colors.surfaceVariant }}
                     color={isPresente ? '#fff' : theme.colors.onSurfaceVariant}
                  />
                  <View style={styles.textContainer}>
                     <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.nomeAluno}</Text>
                     <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                        Carteira: {item.numeroCarteira} • Sala: {item.sala}
                     </Text>
                     <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 2 }}>
                        {item.curso}
                     </Text>
                  </View>
               </View>

               <View style={styles.actionContainer}>
                  {isPresente ? (
                     <Chip icon="check-circle" style={{ backgroundColor: theme.colors.secondaryContainer }} textStyle={{ color: theme.colors.onSecondaryContainer }}>
                        Presente
                     </Chip>
                  ) : (
                     <Button 
                        mode="contained" 
                        onPress={() => abrirConfirmacao(item)}
                        loading={processandoId === item.id}
                        disabled={processandoId !== null}
                        contentStyle={{ paddingHorizontal: 8 }}
                     >
                        Confirmar Prsença
                     </Button>
                  )}
               </View>
            </Card.Content>
         </Card>
      );
   };

   return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
         <Appbar.Header elevated>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Lista de Presença" />
         </Appbar.Header>

         <ScreenContainer>
            <View style={styles.topSection}>
               <View style={styles.statsRow}>
                  <Text variant="titleMedium" style={{ color: theme.colors.outline }}>
                     Total: <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{totalAlunos}</Text>
                  </Text>
                  <Text variant="titleMedium" style={{ color: theme.colors.outline }}>
                     Presentes: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{totalPresentes}</Text>
                  </Text>
               </View>

               <Searchbar
                  placeholder="Buscar aluno, RA ou sala..."
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={{ backgroundColor: theme.colors.surfaceVariant, elevation: 0 }}
               />
            </View>

            {loading ? (
               <ActivityIndicator style={{ marginTop: 50 }} size="large" color={theme.colors.primary} />
            ) : (
               <FlatList
                  data={filteredAlunos}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAluno}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  ListEmptyComponent={
                     <Text style={styles.emptyText}>Nenhum aluno encontrado com esse filtro.</Text>
                  }
               />
            )}
         </ScreenContainer>

         <Portal>
            <Dialog 
               visible={dialogVisible} 
               onDismiss={fecharDialog} 
               style={styles.dialog}
            >
               <Dialog.Icon icon="account-check-outline" />
               <Dialog.Title style={styles.dialogTitle}>Confirmar Presença</Dialog.Title>
               <Dialog.Content>
                  <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                     Deseja registrar a entrada do aluno:
                  </Text>
                  <Text variant="titleLarge" style={styles.alunoNome}>
                     {alunoParaConfirmar?.nomeAluno}
                  </Text>
                  <Divider style={{ marginVertical: 12 }} />
                  <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.outline }}>
                     Esta ação registrará o horário atual e não poderá ser desfeita.
                  </Text>
               </Dialog.Content>
               <Dialog.Actions>
                  <Button onPress={fecharDialog} textColor={theme.colors.error}>Cancelar</Button>
                  <Button mode="contained" onPress={executarCheckin} style={{ marginLeft: 10 }}>Confirmar</Button>
               </Dialog.Actions>
            </Dialog>
         </Portal>
      </View>
   );
}

const styles = StyleSheet.create({
   topSection: { marginBottom: 16 },
   statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
   card: { marginBottom: 10, elevation: 1 },
   cardContent: { flexDirection: 'column', gap: 12 },
   infoContainer: { flexDirection: 'row', alignItems: 'center' },
   textContainer: { marginLeft: 12, flex: 1 },
   actionContainer: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ccc', paddingTop: 10 },
   emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
   // Estilos do Dialog para respeitar o ScreenContainer
   dialog: {
      backgroundColor: 'white',
      borderRadius: 12,
      width: '90%', // Garante margem nas laterais em telas pequenas
      maxWidth: 500, // Limita o tamanho em tablets/web para não ficar gigante
      alignSelf: 'center', // Centraliza o Dialog
   },
   dialogTitle: { textAlign: 'center', fontWeight: 'bold' },
   alunoNome: { textAlign: 'center', marginTop: 8, fontWeight: 'bold', color: '#000' }
});