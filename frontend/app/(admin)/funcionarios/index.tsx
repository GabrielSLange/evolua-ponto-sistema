import React from "react";
import { StyleSheet } from "react-native";
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useFuncionarios } from '@/hooks/admin/useFuncionario';
import ListFuncionarios from '@/components/lists/listFuncionarios';

const FuncionariosAdminScreen = () => {
   const router = useRouter();
   const { estabelecimentoId, estabelecimentoNome, empresaId, empresaNome } = useLocalSearchParams<{ estabelecimentoId: string; estabelecimentoNome: string; empresaId: string, empresaNome: string }>();

   const { funcionarios, loading, toggleFuncionarioAtivo } = useFuncionarios(estabelecimentoId);

   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <Appbar.Header>
            <Appbar.BackAction onPress={() => router.push({
               pathname: `/estabelecimentos`,
               params: { estabelecimentoId: estabelecimentoId, estabelecimentoNome: estabelecimentoNome, empresaId: empresaId, empresaNome: empresaNome }
            })} />
            <Appbar.Content title={`Funcionários de ${estabelecimentoNome}`} />
         </Appbar.Header>
         <ListFuncionarios
            funcionarios={funcionarios}
            loading={loading}
            permissao="admin"
            estabelecimentoId={estabelecimentoId}
            estabelecimentoNome={estabelecimentoNome}
            empresaNome={empresaNome}
            userId={null}
            toggleFuncionarioAtivo={toggleFuncionarioAtivo}
         />
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
});

export default FuncionariosAdminScreen;
