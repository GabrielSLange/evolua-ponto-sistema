import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Appbar, Card, Title, Paragraph, Text, Switch, IconButton, FAB, Tooltip, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useEstabelecimentos } from '../../../hooks/superadmin/useEstabelecimento';
import { ModelEstabelecimento } from '../../../models/ModelEstabelecimento';
import CustomLoader from '@/components/CustomLoader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ListEstabelcimentos from '@/components/lists/listEstabelecimentos';

const EstabelecimentosScreen = () => {
   const router = useRouter();
   const theme = useTheme();
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