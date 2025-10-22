import React from 'react';
import { View } from 'react-native';
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

    if (loading) {
        return <CustomLoader />;
    }

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
                    onSubmit={() => {}} // Não precisa de função de submit na tela de detalhes
                />
            </View>
        </ScreenContainer>
    );
};

export default DetailsFuncionarioScreen;
