import React, { } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EmpresaForm from '../../../components/forms/EmpresaForm';
import CustomLoader from '../../../components/CustomLoader';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useEditEmpresa } from '@/hooks/superadmin/useEmpresa';

const EditEmpresaScreen = () => {

   const router = useRouter();
   const { empresaId } = useLocalSearchParams();

   const { loading, empresa, updateEmpresa } = useEditEmpresa(empresaId as string);

   const handleUpdateEmpresa = async (data: any) => {
      try {
         await updateEmpresa(data);
      } catch (error) {
         console.error("Erro ao atualizar empresa:", error);
      }
   }

   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.back()} />
               <Appbar.Content title="Editar Empresa" />
            </Appbar.Header>
            <EmpresaForm
               onSubmit={handleUpdateEmpresa}
               empresa={empresa || undefined}
               submitButtonLabel="Salvar Alterações"
            />
         </View>
      </ScreenContainer>
   );
};

export default EditEmpresaScreen;