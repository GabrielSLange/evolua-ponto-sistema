import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import EmpresaForm from '../../../components/forms/EmpresaForm';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { ModelEmpresa } from '@/models/ModelEmpresa';
import { useCreateEmpresa } from '@/hooks/superadmin/useEmpresa';
import CustomLoader from '@/components/CustomLoader';

const AddEmpresaScreen = () => {
   const router = useRouter();

   const [loading, addEmpresa] = useCreateEmpresa();

   const handleCreateEmpresa = async (empresa: ModelEmpresa) => {
      try {
         await addEmpresa(empresa);
      }
      catch (error) {
         console.error("Erro ao criar empresa:", error);
      }
   }

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.back()} />
               <Appbar.Content title="Adicionar Nova Empresa" />
            </Appbar.Header>
            <EmpresaForm
               onSubmit={handleCreateEmpresa}
               submitButtonLabel="Cadastrar Empresa"
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

export default AddEmpresaScreen;