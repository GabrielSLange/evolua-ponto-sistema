import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EstabelecimentoForm from '../../../components/forms/EstabelecimentoForm';
import { useAddEstabelecimento } from '@/hooks/superadmin/useEstabelecimento';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';

const AddEstabelecimentoScreen = () => {
   const router = useRouter();
   const { empresaId } = useLocalSearchParams(); // Pega o ID da empresa-mãe

   const { loading, addEstabelecimento } = useAddEstabelecimento(empresaId as string);

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push({
                  pathname: '/(superadmin)/estabelecimentos',
                  params: { empresaId: empresaId }
               })}
               />
               <Appbar.Content title="Novo Estabelecimento" />
            </Appbar.Header>
            <EstabelecimentoForm
               onSubmit={addEstabelecimento}
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

export default AddEstabelecimentoScreen;