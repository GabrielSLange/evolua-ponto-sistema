import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNotification } from '../../../contexts/NotificationContext';
import EstabelecimentoForm from '../../../components/forms/EstabelecimentoForm';
import CustomLoader from '../../../components/CustomLoader';
import { ModelEstabelecimento } from '../../../models/ModelEstabelecimento';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useEditEstabelecimento } from '@/hooks/superadmin/useEstabelecimento';

const EditEstabelecimentoScreen = () => {
   const router = useRouter();
   const { id, empresaId, empresaNome } = useLocalSearchParams();
   const { showNotification } = useNotification();

   const { loading, estabelecimento, updateEstabelecimento } = useEditEstabelecimento(id as string);

   const handleUpdate = async (estabalecimento: ModelEstabelecimento) => {
      try {
         await updateEstabelecimento(estabalecimento);
         router.back();
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      }
   };

   if (loading && !estabelecimento) return <CustomLoader />;

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push(`/estabelecimentos?empresaId=${empresaId}&empresaNome=${empresaNome}`)} />
               <Appbar.Content title="Editar Estabelecimento" />
            </Appbar.Header>
            <EstabelecimentoForm
               isLoading={loading}
               onSubmit={handleUpdate}
               estabelecimento={estabelecimento}
               submitButtonLabel="Salvar Alterações"
            />
         </View>
      </ScreenContainer>
   );
};

export default EditEstabelecimentoScreen;