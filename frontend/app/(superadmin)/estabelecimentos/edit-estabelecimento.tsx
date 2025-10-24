import { Modal, View, StyleSheet } from 'react-native';
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
   const { estabelecimentoId, empresaId } = useLocalSearchParams();
   const { showNotification } = useNotification();

   const { loading, estabelecimento, updateEstabelecimento } = useEditEstabelecimento(estabelecimentoId as string, empresaId as string);



   const handleUpdate = async (estabalecimento: ModelEstabelecimento) => {
      try {
         await updateEstabelecimento(estabalecimento);
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      }
   };


   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push({
                  pathname: '/(superadmin)/estabelecimentos',
                  params: { empresaId: empresaId }
               })}
               />
               <Appbar.Content title="Editar Estabelecimento" />
            </Appbar.Header>
            <EstabelecimentoForm
               onSubmit={handleUpdate}
               estabelecimento={estabelecimento}
               submitButtonLabel="Salvar Alterações"
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

export default EditEstabelecimentoScreen;