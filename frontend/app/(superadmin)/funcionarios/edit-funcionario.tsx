import { View } from "@/components/Themed";
import { Appbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNotification } from "../../../contexts/NotificationContext";
import FuncionarioForm from "../../../components/forms/FuncionarioForm";
import CustomLoader from "../../../components/CustomLoader";
import { ModelFuncionario } from "../../../models/ModelFuncionario";
import ScreenContainer from "@/components/layouts/ScreenContainer";
import { useEditFuncionario } from "@/hooks/superadmin/useFuncionario";

const EditFuncionarioScreen = () => {
    const router = useRouter();
    const { funcionarioId, estabelecimentoId, userId, estabelecimentoNome, empresaNome } = useLocalSearchParams<{ funcionarioId: string; estabelecimentoId: string; userId: string, estabelecimentoNome: string, empresaNome: string }>();

    const { showNotification } = useNotification();

    const { loading, funcionario, updateFuncionario } = useEditFuncionario(funcionarioId as string, estabelecimentoId as string, userId as string);

    const handleUpdate = async (funcionario: ModelFuncionario) => {
        try {
            await updateFuncionario(funcionario);
            showNotification('Funcionário atualizado com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao atualizar funcionário.', 'error');
        }
    };

    if (loading) return <CustomLoader />;

    return (
        <ScreenContainer>
            <View style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.push({
                        pathname: `/funcionarios`,
                        params: { estabelecimentoId: estabelecimentoId, userId: userId, estabelecimentoNome: estabelecimentoNome, empresaNome: empresaNome }
                    })} />
                    <Appbar.Content title="Editar Funcionário" />
                </Appbar.Header>
                <FuncionarioForm
                    onSubmit={handleUpdate}
                    funcionario={funcionario}
                    submitButtonLabel="Salvar Alterações"
                />
            </View>
        </ScreenContainer>
    );
};

export default EditFuncionarioScreen;