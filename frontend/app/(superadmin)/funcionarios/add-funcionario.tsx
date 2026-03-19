import React from "react";
import { View, StyleSheet, Modal } from "react-native";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import { useAddFuncionario } from "@/hooks/superadmin/useFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import CustomLoader from "@/components/CustomLoader";

const AddFuncionarioScreen = () => {
    const router = useRouter();
    const { estabelecimentoId } = useLocalSearchParams<{ estabelecimentoId: string }>(); // Pega o ID do estabelecimento-mãe

    const { loading, addFuncionario, escalas } = useAddFuncionario(estabelecimentoId as string);


    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                        <Appbar.BackAction onPress={() => router.push({
                            pathname: '/(superadmin)/funcionarios',
                            params: { estabelecimentoId: estabelecimentoId }
                        })} />
                    </Appbar.Header>
            <ScreenContainer>
                <View style={{ flex: 1 }}>
                    <FuncionarioForm
                        onSubmit={addFuncionario}
                        submitButtonLabel="Cadastrar"
                        escalas={escalas}
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
        </View>
    );
}

const styles = StyleSheet.create({
    loaderOverlay: {
        flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AddFuncionarioScreen;