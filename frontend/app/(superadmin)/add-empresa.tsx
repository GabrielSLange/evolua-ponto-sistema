import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import EmpresaForm, { EmpresaFormData } from '../../components/forms/EmpresaForm';
import api from '../../services/api';
import ScreenContainer from '../../components/layouts/ScreenContainer';

const AddEmpresaScreen = () => {
   const [loading, setLoading] = useState(false);
   const router = useRouter();

   const handleAddEmpresa = async (data: EmpresaFormData) => {
      setLoading(true);
      try {
         // Chama o endpoint de criação de empresa na nossa API
         await api.post('/empresas', {
            razaoSocial: data.razaoSocial,
            cnpj: data.cnpj,
         });
         // Se a criação for bem-sucedida, volta para a tela anterior (a lista de empresas)
         router.back();
      } catch (error) {
         console.error("Erro ao criar empresa:", error);
         // Aqui você pode adicionar um alerta ou feedback de erro para o usuário
      } finally {
         setLoading(false);
      }
   };

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.back()} />
               <Appbar.Content title="Adicionar Nova Empresa" />
            </Appbar.Header>
            <EmpresaForm
               isLoading={loading}
               onSubmit={handleAddEmpresa}
               submitButtonLabel="Cadastrar Empresa"
            />
         </View>
      </ScreenContainer>
   );
};

export default AddEmpresaScreen;