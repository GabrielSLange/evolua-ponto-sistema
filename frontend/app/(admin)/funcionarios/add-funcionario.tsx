import React from "react";
import { Modal, View, StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import { useAddFuncionario } from "@/hooks/superadmin/useFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import CustomLoader from "@/components/CustomLoader";

const AddFuncionarioScreen = () => {
    const router = useRouter();
    const { estabelecimentoId } = useLocalSearchParams<{ estabelecimentoId: string }>();

    const { loading, addFuncionario } = useAddFuncionario(estabelecimentoId as string);

    return (
        <ScreenContainer>
            <View style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.push({
                        pathname: '/(admin)/funcionarios', // Caminho para o admin
                        params: { estabelecimentoId: estabelecimentoId }
                    })} />
                    <Appbar.Content title="Novo Funcionário" />
                </Appbar.Header>
                <FuncionarioForm
                    onSubmit={addFuncionario}
                    submitButtonLabel="Cadastrar"
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

export default AddFuncionarioScreen;