import React from "react";
import { Modal, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useFuncionarios } from '../../../hooks/superadmin/useFuncionario';
import ListFuncionarios from '../../../components/lists/listFuncionarios';
import { View } from "@/components/Themed";

const FuncionariosScreen = () => {
   const router = useRouter();
   // Pega o ID do estabelecimento e o nome do estabelecimento passados na navegação
   const { estabelecimentoId, estabelecimentoNome, empresaId, empresaNome } = useLocalSearchParams<{ estabelecimentoId: string; estabelecimentoNome: string; empresaId: string, empresaNome: string }>();

   // Usa o nosso hook (Controller) para buscar os dados
   const { funcionarios, loading, toggleFuncionarioAtivo } = useFuncionarios(estabelecimentoId);


   return (
      <ScreenContainer>
         <View style={{ flex: 1 }} >
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push({
                  pathname: `/estabelecimentos`,
                  params: { estabelecimentoId: estabelecimentoId, estabelecimentoNome: estabelecimentoNome, empresaId: empresaId, empresaNome: empresaNome }
               })} />
               <Appbar.Content title={`Funcionários de ${estabelecimentoNome}`} />
            </Appbar.Header>
            <ListFuncionarios
               funcionarios={funcionarios}
               permissao="superadmin"
               estabelecimentoId={estabelecimentoId}
               estabelecimentoNome={estabelecimentoNome}
               empresaNome={empresaNome}
               userId={null}
               toggleFuncionarioAtivo={toggleFuncionarioAtivo}
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
      </ScreenContainer >
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



export default FuncionariosScreen;