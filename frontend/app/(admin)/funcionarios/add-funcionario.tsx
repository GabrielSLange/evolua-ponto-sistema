import React from "react";
import { Modal, View, StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import { useAddFuncionario } from "@/hooks/admin/useFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import CustomLoader from "@/components/CustomLoader";

const AddFuncionarioScreen = () => {
    const router = useRouter();
    const { estabelecimentoId, empresaId } = useLocalSearchParams<{ estabelecimentoId?: string; empresaId?: string }>();

    const { loading, addFuncionario, escalas, estabelecimentos } = useAddFuncionario(estabelecimentoId, empresaId);

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => {
                    if (estabelecimentoId) {
                        router.push({
                            pathname: '/(admin)/funcionarios',
                            params: { estabelecimentoId: estabelecimentoId }
                        });
                    } else {
                        router.push('/(admin)/todos-funcionarios');
                    }
                }} />
            </Appbar.Header>
            <ScreenContainer>
                <View style={{ flex: 1 }}>
                    
                    <FuncionarioForm
                        funcionario={{ estabelecimentoId: estabelecimentoId || '' } as any}
                        onSubmit={addFuncionario}
                        submitButtonLabel="Cadastrar"
                        escalas={escalas}
                        estabelecimentos={estabelecimentos}
                        fixedEstabelecimentoId={!!estabelecimentoId}
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