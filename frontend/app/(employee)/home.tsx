import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, Chip, useTheme, Surface, IconButton, Badge } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useFocusEffect } from 'expo-router';
import { EspelhoPontoDto, DiaEspelhoDto } from '../../models/Dtos/EspelhoPontoDto';
import { set } from 'date-fns';

export default function HomeScreen() {
   const { userId } = useAuth();
   const theme = useTheme();

   const [espelho, setEspelho] = useState<EspelhoPontoDto | null>(null);
   const [nomeFuncionario, setNomeFuncionario] = useState<string>('');
   const [loading, setLoading] = useState(false);
   const [refreshing, setRefreshing] = useState(false);

   // --- BUSCA DE DADOS ---
   const fetchEspelho = async () => {
      const funcionarioId = userId;
      if (!funcionarioId) {
         return;
      }

      try {
         // Apenas na primeira carga mostramos o spinner tela cheia
         if (!espelho) setLoading(true);

         const response = await api.get('/EspelhoPonto/home', {
            params: { funcionarioId: funcionarioId}
         });

         if (response.data.success) {
            setEspelho(response.data.data);
         }

         const funcionarioResponse = await api.get('/funcionarios/id', {
            params: { funcionarioId: funcionarioId }
         });
         setNomeFuncionario(funcionarioResponse.data.nome);

      } catch (error) {
         console.log('Erro ao buscar espelho', error);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   useFocusEffect(
      useCallback(() => {
         fetchEspelho();
      }, [])
   );

   const onRefresh = () => {
      setRefreshing(true);
      fetchEspelho();
   };

   // --- RENDERIZAÇÃO DE CADA DIA ---
   const renderDia = ({ item }: { item: DiaEspelhoDto }) => {
      const dataObj = new Date(item.data);

      // Configuração Visual Dinâmica
      let cardColor = theme.colors.surface;
      let borderColor = 'transparent';
      let borderWidth = 0;
      let diaTextColor = theme.colors.onSurface;

      // 1. Destaque para HOJE
      if (item.isHoje) {
         borderColor = theme.colors.primary;
         borderWidth = 2;
         cardColor = theme.colors.elevation.level2;
      }
      // 2. Fim de semana ou Folga
      else if (item.isFimDeSemana || item.status === 'Folga') {
         cardColor = theme.colors.background; // Cor de fundo (mais apagado)
         diaTextColor = theme.colors.outline;
      }
      // 3. Falta (Dia útil passado sem registro)
      else if (item.status === 'Falta') {
         borderColor = theme.colors.error;
         borderWidth = 1;
         cardColor = theme.colors.errorContainer; // Levemente vermelho
      }

      return (
         <Card style={[styles.cardDia, { backgroundColor: cardColor, borderColor, borderWidth }]} mode="contained">
            <Card.Content style={styles.cardContent}>

               {/* ESQUERDA: Data e Dia da Semana */}
               <View style={styles.dateColumn}>
                  <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: diaTextColor }}>
                     {dataObj.getDate()}
                  </Text>
                  <Text variant="labelSmall" style={{ textTransform: 'uppercase', color: diaTextColor }}>
                     {item.diaSemana}
                  </Text>
                  {item.isHoje && (
                     <Badge size={8} style={{ backgroundColor: theme.colors.primary, marginTop: 4 }} />
                  )}
               </View>

               {/* MEIO: Lista de Marcações (Chips) */}
               <View style={styles.marcacoesColumn}>
                  {item.marcacoes.length > 0 ? (
                     <View style={styles.chipsContainer}>
                        {item.marcacoes.map((m, index) => (
                           <Chip
                              key={index}
                              style={styles.chip}
                              textStyle={{ fontSize: 11, marginVertical: -4 }} // Compactar texto
                              mode="outlined"
                              // Ícone muda se for manual
                              icon={m.statusSolicitacao === 'Pendente' ? 'clock-outline' : (m.tipo === 'ENTRADA' ? 'login' : 'logout')}
                           >
                              {m.hora}
                           </Chip>
                        ))}
                     </View>
                  ) : (
                     // Texto de status quando não tem marcação
                     <Text variant="bodySmall" style={{ fontStyle: 'italic', color: theme.colors.outline, marginTop: 6 }}>
                        {item.status === 'Futuro' ? '---' :
                           item.status === 'Falta' ? 'Ausente' :
                              item.isFimDeSemana || item.isFeriado ? 'Folga' : 'Sem registros'}
                     </Text>
                  )}
               </View>

               {/* DIREITA: Indicador de Status/Alerta */}
               <View style={styles.statusColumn}>
                  {item.status === 'Falta' && (
                     <IconButton icon="alert-circle" iconColor={theme.colors.error} size={20} />
                  )}
                  {item.status === 'Incompleto' && !item.isHoje && (
                     <IconButton icon="clock-alert-outline" iconColor={theme.colors.error} size={20} />
                  )}
               </View>

            </Card.Content>
         </Card>
      );
   };

   return (
      <ScreenContainer>
         {/* --- CABEÇALHO --- */}
         <View style={styles.header}>
            <View>
               <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>Olá, {nomeFuncionario}</Text>
               <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>Meu Ponto</Text>
            </View>
            {/* Avatar ou Logo da Empresa */}
            <Avatar.Icon icon="calendar-check" size={48} style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />
         </View>

         {/* --- CARD DE RESUMO --- */}
         {espelho && (
            <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]} elevation={2}>
               <View>
                  <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: '600' }}>REFERÊNCIA</Text>
                  <Text variant="titleLarge" style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>{espelho.mesReferencia}</Text>
               </View>
               {/* <View style={{alignItems: 'flex-end'}}>
                <Text style={{color: theme.colors.onPrimary, fontSize: 12, fontWeight: '600'}}>BANCO DE HORAS</Text>
                <Text variant="titleLarge" style={{color: theme.colors.onPrimary, fontWeight: 'bold'}}>{espelho.saldoPrevisto}</Text>
            </View> */}
            </Surface>
         )}

         {/* --- LISTA CALENDÁRIO --- */}
         {loading && !espelho ? (
            <ActivityIndicator style={{ marginTop: 50 }} size="large" />
         ) : (
            <FlatList
               data={espelho?.dias || []}
               renderItem={renderDia}
               keyExtractor={(item) => item.data}
               contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
               refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
               ListEmptyComponent={
                  <View style={{ alignItems: 'center', marginTop: 40 }}>
                     <Text style={{ color: theme.colors.outline }}>Nenhum registro encontrado neste mês.</Text>
                  </View>
               }
            />
         )}
      </ScreenContainer>
   );
}

const styles = StyleSheet.create({
   header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
      marginTop: 8
   },
   summaryCard: {
      marginHorizontal: 16,
      borderRadius: 16, // Mais arredondado
      padding: 24,
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
   },
   cardDia: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      elevation: 0, // Flat design
   },
   cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
   },
   dateColumn: {
      alignItems: 'center',
      width: 50,
      borderRightWidth: 1,
      borderRightColor: '#bbb', // Separador sutil
      marginRight: 12,
      paddingRight: 4
   },
   marcacoesColumn: {
      flex: 1,
      justifyContent: 'center',
   },
   chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
   },
   chip: {
      height: 26, // Chip bem compacto
      alignItems: 'center',
      justifyContent: 'center',
   },
   statusColumn: {
      width: 30,
      alignItems: 'center',
      justifyContent: 'center',
   }
});