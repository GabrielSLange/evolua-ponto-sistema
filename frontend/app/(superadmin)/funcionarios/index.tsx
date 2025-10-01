import React from "react";
import { StyleSheet } from 'react-native';
import { useTheme, Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useFuncionarios } from '../../../hooks/superadmin/useFuncionario';
import ListFuncionarios from '../../../components/lists/listFuncionarios';

const FuncionariosScreen = () => {
    const router = useRouter();
    const theme = useTheme();
    // Pega o ID do estabelecimento e o nome do estabelecimento passados na navegação
    const { estabelecimentoId, estabelecimentoNome, empresaId } = useLocalSearchParams<{ estabelecimentoId: string; estabelecimentoNome: string; empresaId: string }>();

    // Usa o nosso hook (Controller) para buscar os dados
    const { funcionarios, loading, toggleFuncionarioAtivo } = useFuncionarios(empresaId);

    if (loading) {
        return <CustomLoader />;
    }

    return (
        <ScreenContainer>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={`Funcionários de ${estabelecimentoNome}`} />
            </Appbar.Header>
            <ListFuncionarios
                funcionarios={funcionarios}
                loading={loading}
                permissao="superadmin"
                estabelecimentoId={estabelecimentoId}
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

export default FuncionariosScreen;