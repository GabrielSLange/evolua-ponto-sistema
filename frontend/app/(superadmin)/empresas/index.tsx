import { View, FlatList, StyleSheet, Pressable, Modal } from 'react-native';
import { Text, Card, Title, Paragraph, FAB, IconButton, Switch, Tooltip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CustomLoader from '../../../components/CustomLoader';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useEmpresa } from '@/hooks/superadmin/useEmpresa';
import React from 'react';
import { ModelEmpresa } from '@/models/ModelEmpresa';

const SuperAdminScreen = () => {
   const { empresas, loading, toggleEmpresaAtivo, formatCNPJ } = useEmpresa();
   const router = useRouter();
   const theme = useTheme();
   const iconColor = theme.colors.secondary;

   return (
      <ScreenContainer>
         <View style={styles.container}>
            <FlatList
               data={empresas}
               keyExtractor={(item) => item.id as string}
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
                              onValueChange={() => toggleEmpresaAtivo(item.id as string)}
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
                        <View style={{ flexDirection: 'row' }}>
                           <Tooltip title="Acessar Estabelecimentos" enterTouchDelay={0} leaveTouchDelay={0}>
                              <IconButton
                                 icon="office-building-marker"
                                 iconColor={iconColor}
                                 containerColor="transparent"
                                 onPress={() => router.push(
                                    {
                                       pathname: '/(superadmin)/estabelecimentos',
                                       params: { empresaId: item.id, empresaNome: item.razaoSocial }
                                    }
                                 )}
                              />
                           </Tooltip>

                           <Tooltip title="Editar Empresa" enterTouchDelay={0} leaveTouchDelay={0}>
                              <IconButton
                                 icon="pencil"
                                 iconColor={iconColor}
                                 containerColor="transparent"
                                 onPress={() => router.push(`empresas/edit-empresa?empresaId=${item.id}`)}
                              />
                           </Tooltip>
                        </View>
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
            <Modal
               transparent={true}
               animationType="fade"
               visible={loading}
            >
               <View style={styles.loaderOverlay}>
                  <CustomLoader />
               </View>
            </Modal>
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
   },
   loaderOverlay: {
      flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
   },
});

export default SuperAdminScreen;