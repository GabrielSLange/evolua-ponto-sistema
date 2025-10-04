import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useEstabelecimentos } from '../../../hooks/superadmin/useEstabelecimento';
import CustomLoader from '@/components/CustomLoader';
import ListEstabelcimentos from '@/components/lists/listEstabelecimentos';

const EstabelecimentosScreen = () => {
   const router = useRouter();
   // Pega o ID da empresa e o nome da empresa passados na navegação
   const { empresaId, empresaNome } = useLocalSearchParams<{ empresaId: string; empresaNome: string }>();

   // Usa o nosso hook (Controller) para buscar os dados
   const { estabelecimentos, loading, toggleEstabelecimentoAtivo } = useEstabelecimentos(empresaId);

   if (loading) {
      return <CustomLoader />;
   }


   return (
      <ScreenContainer>
         <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title={`Estabelecimentos de ${empresaNome}`} />
         </Appbar.Header>
         <ListEstabelcimentos
            estabelecimentos={estabelecimentos}
            loading={loading}
            permissao="superadmin"
            empresaId={empresaId}
            empresaNome={empresaNome}
            userId={null}
            toggleEstabelecimentoAtivo={toggleEstabelecimentoAtivo}
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

export default EstabelecimentosScreen;