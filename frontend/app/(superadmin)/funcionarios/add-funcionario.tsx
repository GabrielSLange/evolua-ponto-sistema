import React from "react";
import { View } from "react-native";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import { useAddFuncionario } from "@/hooks/superadmin/useFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";

const AddFuncionarioScreen = () => {
    const router = useRouter();
    const { estabelecimentoId, estabelecimentoNome } = useLocalSearchParams<{ estabelecimentoId: string; estabelecimentoNome: string; empresaId: string }>(); // Pega o ID do estabelecimento-mãe

    const { loading, addFuncionario } = useAddFuncionario(estabelecimentoId as string, estabelecimentoNome as string);

    return (
        <ScreenContainer>
            <View style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.push(`/funcionarios?estabelecimentoId=${estabelecimentoId}&estabelecimentoNome=${estabelecimentoNome}`)} />
                    <Appbar.Content title="Novo Funcionário" />
                </Appbar.Header>
                <FuncionarioForm
                    isLoading={loading}
                    onSubmit={addFuncionario}
                    submitButtonLabel="Cadastrar"
                />
            </View>
        </ScreenContainer>
    );
}

export default AddFuncionarioScreen;