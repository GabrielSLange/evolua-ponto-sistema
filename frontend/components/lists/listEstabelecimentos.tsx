import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Card, Title, Paragraph, Text, Switch, IconButton, FAB, Tooltip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ModelEstabelecimento } from '../../models/ModelEstabelecimento';
import CustomLoader from '@/components/CustomLoader';

interface ListEstabelcimentosProps {
   estabelecimentos: ModelEstabelecimento[];
   loading: boolean;
   permissao: string;
   userId: string | null;
   empresaId?: string;
   empresaNome?: string;
   toggleEstabelecimentoAtivo: (id: string) => void;
}

const ListEstabelcimentos: React.FC<ListEstabelcimentosProps> = ({
   estabelecimentos,
   loading,
   permissao,
   userId,
   empresaId,
   empresaNome,
   toggleEstabelecimentoAtivo,
}) => {
   const router = useRouter();
   const theme = useTheme();
   const iconColor = theme.colors.secondary;
   // Pega o ID da empresa e o nome da empresa passados na navegação

   if (loading) {
      return <CustomLoader />;
   }


   return (
      <View style={styles.container}>
         <FlatList
            data={estabelecimentos}
            keyExtractor={(item) => item.id as string}
            contentContainerStyle={styles.listContentContainer}
            renderItem={({ item }: { item: ModelEstabelecimento }) => (
               <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                     <Pressable
                        style={styles.titleContainer}
                        onPress={() => router.push({
                           pathname: '/(superadmin)/funcionarios',
                           params: { estabelecimentoId: item.id, estabelecimentoNome: item.nomeFantasia, empresaId: empresaId, empresaNome: empresaNome }
                        })}
                     >
                        <Title>{item.nomeFantasia}</Title>
                     </Pressable>

                     <View style={styles.switchContainer}>
                        <Text style={{ marginRight: 8 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                        <Switch
                           value={item.ativo}
                           onValueChange={() => toggleEstabelecimentoAtivo(item.id as string)}
                        />
                     </View>

                  </View>

                  <Pressable
                     onPress={() => router.push({
                        pathname: '/(superadmin)/funcionarios',
                        params: { estabelecimentoId: item.id, estabelecimentoNome: item.nomeFantasia, empresaId: empresaId, empresaNome: empresaNome }
                     })}
                  />

                  <Card.Content>
                     <Paragraph>{`${item.logradouro}, ${item.numero} - ${item.bairro}`}</Paragraph>
                     <Paragraph>{`${item.cidade} / ${item.estado}`}</Paragraph>
                  </Card.Content>

                  {/* As ações ficam separadas no final */}
                  <Card.Actions >
                     <View style={{ flexDirection: 'row' }}>
                        <Tooltip title="Gerenciar Funcionários" enterTouchDelay={0} leaveTouchDelay={0}>
                           <IconButton
                              icon="account-group"
                              iconColor={iconColor}
                              onPress={() => router.push({
                                 pathname: '/(superadmin)/funcionarios',
                                 params: { estabelecimentoId: item.id, estabelecimentoNome: item.nomeFantasia, empresaId: empresaId, empresaNome: empresaNome }
                              })}
                           />
                        </Tooltip>
                        <Tooltip title="Editar Estabelecimento" enterTouchDelay={0} leaveTouchDelay={0}>
                           <IconButton
                              icon="pencil"
                              iconColor={iconColor}
                              onPress={() => router.push({
                                 pathname: `/(${permissao})/estabelecimentos/edit-estabelecimento`,
                                 params: { estabelecimentoId: item.id, userId: userId, empresaId: empresaId, empresaNome: item.nomeFantasia }
                              })}
                           />
                        </Tooltip>
                     </View>
                  </Card.Actions>
               </Card>
            )}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text>Nenhum estabelecimento cadastrado.</Text></View>}
         />
         <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => {
               router.push({
                  pathname: `/(${permissao})/estabelecimentos/add-estabelecimento`,
                  params: { empresaId: empresaId, userId: userId }
               });
            }}
         />
      </View>
   );
};

const styles = StyleSheet.create({
   card: {
      margin: 8
   },
   emptyContainer: {
      flex: 1, marginTop: 50, alignItems: 'center'
   },
   cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
   },
   titleContainer: {
      flex: 1, // Faz o título ocupar o espaço disponível
   },
   switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   cardActions: {
      justifyContent: 'flex-end', // Alinha o botão de editar à direita
   },
   container: {
      flex: 1,
   },
   fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
   },
   listContentContainer: {
      paddingBottom: 80,
   }
});

export default ListEstabelcimentos;

