import React from "react";
import { View } from "react-native";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import { useAddFuncionario } from "@/hooks/superadmin/useFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import CustomLoader from "@/components/CustomLoader";

const AddFuncionarioScreen = () => {
    const router = useRouter();
    const { estabelecimentoId, estabelecimentoNome, empresaNome } = useLocalSearchParams<{ estabelecimentoId: string; estabelecimentoNome: string; empresaNome: string }>(); // Pega o ID do estabelecimento-mãe

    const { loading, addFuncionario } = useAddFuncionario(estabelecimentoId as string, estabelecimentoNome as string);

    if (loading) return <CustomLoader />;

    return (
        <ScreenContainer>
            <View style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.push({
                        pathname: `/funcionarios`,
                        params: { estabelecimentoId: estabelecimentoId, estabelecimentoNome: estabelecimentoNome, empresaNome: empresaNome }
                    })} />
                    <Appbar.Content title="Novo Funcionário" />
                </Appbar.Header>
                <FuncionarioForm
                    onSubmit={addFuncionario}
                    submitButtonLabel="Cadastrar"
                />
            </View>
        </ScreenContainer>
    );
}

export default AddFuncionarioScreen;