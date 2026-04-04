import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNotification } from "../../../contexts/NotificationContext";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import CustomLoader from "../../../components/CustomLoader";
import { ModelFuncionario } from "../../../models/ModelFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import { useEditFuncionario } from "@/hooks/admin/useFuncionario";
import { Modal, StyleSheet, View } from "react-native";

const EditFuncionarioAdminScreen = () => {
    const router = useRouter();
    const { funcionarioId, estabelecimentoId, isReadOnly: isReadOnlyParam } = useLocalSearchParams<{ funcionarioId: string; estabelecimentoId: string; isReadOnly: string }>();

    const { showNotification } = useNotification();
    const isReadOnly = isReadOnlyParam === 'true';

    const { loading, funcionario, estabelecimentos, escalas, updateFuncionario } = useEditFuncionario(funcionarioId as string, estabelecimentoId as string);


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
                        onSubmit={isReadOnly ? () => { } : updateFuncionario}
                        funcionario={funcionario}
                        submitButtonLabel={isReadOnly ? "" : "Salvar Alterações"}
                        estabelecimentos={funcionario ? estabelecimentos : []}
                        escalas={escalas}
                        isReadOnly={isReadOnly}
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

export default EditFuncionarioAdminScreen;