import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNotification } from '../../../contexts/NotificationContext';
import EstabelecimentoForm from '../../../components/forms/EstabelecimentoForm';
import CustomLoader from '../../../components/CustomLoader';
import { ModelEstabelecimento } from '../../../models/ModelEstabelecimento';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useEditEstabelecimento } from '@/hooks/admin/useEstabelecimento';

const EditEstabelecimentoScreen = () => {
   const router = useRouter();
   const { estabelecimentoId, userId } = useLocalSearchParams();
   const { showNotification } = useNotification();

   const { loading, estabelecimento, updateEstabelecimento } = useEditEstabelecimento(estabelecimentoId as string, userId as string);



   const handleUpdate = async (estabalecimento: ModelEstabelecimento) => {
      try {
         await updateEstabelecimento(estabalecimento);
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      }
   };

   if (loading && !estabelecimento) return <CustomLoader />;

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push(`/(admin)/estabelecimentos?userId=${userId}`)} />
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