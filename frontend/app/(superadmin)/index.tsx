import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Text, Card, Title, Paragraph, FAB, Dialog, Button, Portal, Snackbar } from 'react-native-paper';
// 1. Importe o 'useFocusEffect' no lugar do 'useEffect'
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../services/api';
import CustomLoader from '../../components/CustomLoader';
import ScreenContainer from '../../components/layouts/ScreenContainer';

interface Empresa {
   id: string;
   razaoSocial: string;
   cnpj: string;
}

const SuperAdminScreen = () => {
   const [empresas, setEmpresas] = useState<Empresa[]>([]);
   const [loading, setLoading] = useState(true);
   const router = useRouter();

   const [dialogVisible, setDialogVisible] = useState(false);
   const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
   const [snackbarVisible, setSnackbarVisible] = useState(false);
   const [snackbarMessage, setSnackbarMessage] = useState('');

   const { width } = useWindowDimensions();
   const isDesktop = Platform.OS === 'web' && width > 768;

   const showDeleteDialog = (empresa: Empresa) => {
      setEmpresaToDelete(empresa);
      setDialogVisible(true);
   };

   const hideDeleteDialog = () => {
      setDialogVisible(false);
      setEmpresaToDelete(null);
   };

   const handleDeleteConfirm = async () => {
      if (!empresaToDelete) return;
      setLoading(true);
      try {
         await api.delete(`/Empresas?Id=${empresaToDelete.id}`);
         setSnackbarMessage('Empresa excluída com sucesso!');
         setSnackbarVisible(true);
         fetchEmpresas(); // Atualiza a lista
      } catch (error) {
         console.error("Erro ao excluir empresa:", error);
         setSnackbarMessage('Erro ao excluir empresa.');
         setSnackbarVisible(true);
      } finally {
         setLoading(false);
         hideDeleteDialog();
      }
   };


   // 2. A função de busca de dados agora é envolvida com 'useCallback'
   //    Isso é uma otimização recomendada para usar com useFocusEffect.
   const fetchEmpresas = useCallback(() => {
      setLoading(true); // Mostra o loader sempre que a tela ganhar foco
      api.get('/empresas')
         .then(response => {
            if (response.data && response.data) {
               setEmpresas(response.data);
            }
         })
         .catch(error => {
            console.error("Erro ao buscar empresas:", error);
         })
         .finally(() => {
            setLoading(false);
         });
   }, []);

   // 3. Substituímos o useEffect pelo useFocusEffect
   //    Este hook executa a função 'fetchEmpresas' toda vez que a tela entra em foco.
   useFocusEffect(fetchEmpresas);

   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <View style={styles.container}>
            <FlatList
               data={empresas}
               keyExtractor={(item) => item.id}
               renderItem={({ item }) => (
                  <Card style={styles.card}>
                     <Card.Content>
                        <Title>{item.razaoSocial}</Title>
                        <Paragraph>CNPJ: {item.cnpj}</Paragraph>
                     </Card.Content>
                     <Card.Actions>
                        <Button onPress={() => router.push(`/(superadmin)/edit-empresa?id=${item.id}`)}>
                           Editar
                        </Button>
                        <Button onPress={() => showDeleteDialog(item)}>Excluir</Button>
                     </Card.Actions>
                  </Card>
               )}
               ListEmptyComponent={<View style={styles.emptyContainer}><Text>Nenhuma empresa cadastrada.</Text></View>}
            />
            <FAB
               style={styles.fab}
               icon="plus"
               onPress={() => {
                  router.push('/(superadmin)/add-empresa');
               }}
            />

            <Portal>
               {/* 3. Aplicamos o estilo condicionalmente ao Dialog */}
               <Dialog
                  visible={dialogVisible}
                  onDismiss={hideDeleteDialog}
                  style={isDesktop ? styles.dialogDesktop : {}}
               >
                  <Dialog.Title>Confirmar Exclusão</Dialog.Title>
                  <Dialog.Content>
                     <Paragraph>Tem certeza que deseja excluir a empresa "{empresaToDelete?.razaoSocial}"? Esta ação não pode ser desfeita.</Paragraph>
                  </Dialog.Content>
                  <Dialog.Actions>
                     <Button onPress={hideDeleteDialog}>Cancelar</Button>
                     <Button onPress={handleDeleteConfirm}>Excluir</Button>
                  </Dialog.Actions>
               </Dialog>
            </Portal>

            <Snackbar
               visible={snackbarVisible}
               onDismiss={() => setSnackbarVisible(false)}
               duration={3000}
            >
               {snackbarMessage}
            </Snackbar>
         </View>
      </ScreenContainer>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   card: {
      margin: 8,
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
   dialogDesktop: {
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
   }
});

export default SuperAdminScreen;