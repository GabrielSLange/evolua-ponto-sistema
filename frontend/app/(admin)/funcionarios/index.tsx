import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from "react-native";
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useFuncionarios } from '@/hooks/admin/useFuncionario';
import ListFuncionarios from '@/components/lists/listFuncionarios';
import api from '../../../services/api';

const FuncionariosAdminScreen = () => {
   const router = useRouter();
   const { estabelecimentoId } = useLocalSearchParams<{ estabelecimentoId: string }>();

   const [headerTitle, setHeaderTitle] = useState('Funcionários');
   const [fetchingDetails, setFetchingDetails] = useState(false);
   const [empresaId, setEmpresaId] = useState<string | undefined>(undefined);

   useEffect(() => {
      if (estabelecimentoId) {
         setFetchingDetails(true);
         // Busca os detalhes do estabelecimento para obter seu nome e o ID da empresa pai
         api.get(`/estabelecimento/Id?estabelecimentoId=${estabelecimentoId}`)
            .then(response => {
               if (response.data) {
                  const { nomeFantasia, empresaId: fetchedEmpresaId } = response.data;
                  setHeaderTitle(`Funcionários de ${nomeFantasia}`);
                  setEmpresaId(fetchedEmpresaId);
               }
            })
            .catch(error => {
               console.error("Erro ao buscar detalhes do estabelecimento:", error);
            })
            .finally(() => setFetchingDetails(false));
      }
   }, [estabelecimentoId]);

   const { funcionarios, loading, toggleFuncionarioAtivo } = useFuncionarios(estabelecimentoId);

   const handleBack = () => {
      if (empresaId) {
         router.push({
            pathname: '/(admin)/estabelecimentos', // Caminho para o admin
            params: { empresaId: empresaId }
         });
      } else {
         router.back(); // Fallback
      }
   };

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={handleBack} />
               <Appbar.Content title={headerTitle} />
            </Appbar.Header>
            <ListFuncionarios
               funcionarios={funcionarios}
               permissao="admin"
               estabelecimentoId={estabelecimentoId}
               userId={null}
               toggleFuncionarioAtivo={toggleFuncionarioAtivo}
            />
            <Modal
               transparent={true}
               animationType="fade"
               visible={loading || fetchingDetails}
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
   loaderOverlay: {
      flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
   },
});



export default FuncionariosAdminScreen;
