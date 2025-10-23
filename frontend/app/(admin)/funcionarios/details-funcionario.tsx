import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FuncionarioForm from '../../../components/forms/FuncionarioForm';
import CustomLoader from '../../../components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useEditFuncionario } from '@/hooks/superadmin/useFuncionario';

const DetailsFuncionarioScreen = () => {
    const router = useRouter();
    // Pega os parâmetros da navegação
    const { funcionarioId, estabelecimentoId, estabelecimentoNome, empresaNome } = useLocalSearchParams<{ funcionarioId: string; estabelecimentoId: string; estabelecimentoNome: string, empresaNome: string }>();

    // Reutiliza o mesmo hook da tela de edição para buscar os dados
    const { loading, funcionario, estabelecimentos } = useEditFuncionario(funcionarioId as string, estabelecimentoId as string, estabelecimentoNome as string, empresaNome as string);



    return (
        <ScreenContainer>
            <View style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.push({
                        pathname: `/funcionarios`,
                        params: { estabelecimentoId: estabelecimentoId, estabelecimentoNome: estabelecimentoNome, empresaNome: empresaNome }
                    })} />
                    <Appbar.Content title="Detalhes do Funcionário" />
                </Appbar.Header>
                <FuncionarioForm
                    funcionario={funcionario}
                    estabelecimentos={estabelecimentos}
                    isReadOnly={true} // A mágica acontece aqui!
                    onSubmit={() => { }} // Não precisa de função de submit na tela de detalhes
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
    loaderOverlay: {
        flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default DetailsFuncionarioScreen;
