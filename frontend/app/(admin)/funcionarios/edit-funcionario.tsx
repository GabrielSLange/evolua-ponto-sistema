import { View } from "@/components/Themed";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNotification } from "../../../contexts/NotificationContext";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import CustomLoader from "../../../components/CustomLoader";
import { ModelFuncionario } from "../../../models/ModelFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import { useEditFuncionario } from "@/hooks/superadmin/useFuncionario";
import { Modal, StyleSheet } from "react-native";

const EditFuncionarioAdminScreen = () => {
    const router = useRouter();
    const { funcionarioId, estabelecimentoId, isReadOnly: isReadOnlyParam } = useLocalSearchParams<{ funcionarioId: string; estabelecimentoId: string; isReadOnly: string }>();

    const { showNotification } = useNotification();
    const isReadOnly = isReadOnlyParam === 'true';

    const { loading, funcionario, estabelecimentos, updateFuncionario } = useEditFuncionario(funcionarioId as string, estabelecimentoId as string);

    const handleUpdate = async (funcionario: ModelFuncionario) => {
        try {
            await updateFuncionario(funcionario);
            showNotification('Funcionário atualizado com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao atualizar funcionário.', 'error');
        }
    };

    return (
        <ScreenContainer>
            <View style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.push({
                        pathname: '/(admin)/funcionarios', // Caminho para o admin
                        params: { estabelecimentoId: estabelecimentoId }
                    })} />
                    <Appbar.Content title={isReadOnly ? "Detalhes do Funcionário" : "Editar Funcionário"} />
                </Appbar.Header>
                <FuncionarioForm
                    onSubmit={isReadOnly ? () => { } : handleUpdate}
                    funcionario={funcionario}
                    submitButtonLabel={isReadOnly ? "" : "Salvar Alterações"}
                    estabelecimentos={funcionario ? estabelecimentos : []}
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