import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Text, Card, Title, Paragraph, FAB, Button, IconButton, Switch, Portal, Dialog } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CustomLoader from '../../../components/CustomLoader';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useEmpresa } from '@/hooks/superadmin/useEmpresa';
import React from 'react';
import { ModelEmpresa } from '@/models/ModelEmpresa';



const SuperAdminScreen = () => {
   const { empresas, loading, toggleEmpresaAtivo, formatCNPJ } = useEmpresa();
   const router = useRouter();


   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <View style={styles.container}>
            <FlatList
               data={empresas}
               keyExtractor={(item) => item.id}
               contentContainerStyle={styles.listContentContainer}
               renderItem={({ item }: { item: ModelEmpresa }) => (
                  <Card style={styles.card}>
                     {/* O conteúdo do card agora é dividido em seções */}
                     <View style={styles.cardHeader}>
                        {/* Esta parte do cabeçalho é clicável para navegar */}
                        <Pressable
                           style={styles.titleContainer}
                           onPress={() => router.push({
                              pathname: '/(superadmin)/estabelecimentos',
                              params: { empresaId: item.id, empresaNome: item.razaoSocial }
                           })}
                        >
                           <Title>{item.razaoSocial}</Title>
                        </Pressable>

                        {/* O Switch fica no cabeçalho, mas fora do Pressable de navegação */}
                        <View style={styles.switchContainer}>
                           <Text style={{ marginRight: 8 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                           <Switch
                              value={item.ativo}
                              onValueChange={() => toggleEmpresaAtivo(item.id)}
                           />
                        </View>
                     </View>

                     {/* O corpo do card também é clicável para navegação */}
                     <Pressable
                        onPress={() => router.push({
                           pathname: '/(superadmin)/estabelecimentos',
                           params: { empresaId: item.id, empresaNome: item.razaoSocial }
                        })}
                     >
                        <Card.Content>
                           <Paragraph>CNPJ: {formatCNPJ(item.cnpj)}</Paragraph>
                        </Card.Content>
                     </Pressable>

                     {/* As ações ficam separadas no final */}
                     <Card.Actions style={styles.cardActions}>
                        <IconButton
                           icon="pencil"
                           onPress={() => router.push(`/(superadmin)/empresas/edit-empresa?id=${item.id}`)}
                        />
                     </Card.Actions>
                  </Card>
               )}
               ListEmptyComponent={<View style={styles.emptyContainer}><Text>Nenhuma empresa cadastrada.</Text></View>}
            />
            <FAB
               style={styles.fab}
               icon="plus"
               onPress={() => {
                  router.push('/(superadmin)/empresas/add-empresa');
               }}
            />
         </View>
      </ScreenContainer>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
   },
   emptyContainer: {
      flex: 1,
      marginTop: 50,
      alignItems: 'center',
      justifyContent: 'center',
   },
   editButton: {
      marginRight: 'auto',

   },
   card: {
      margin: 8,
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
   listContentContainer: {
      paddingBottom: 80,
   }
});

export default SuperAdminScreen;