import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EmpresaForm, { EmpresaFormData } from '../../components/forms/EmpresaForm';
import api from '../../services/api';
import CustomLoader from '../../components/CustomLoader';
import ScreenContainer from '../../components/layouts/ScreenContainer';

const EditEmpresaScreen = () => {
   const [loading, setLoading] = useState(false);
   const [initialData, setInitialData] = useState<EmpresaFormData | undefined>(undefined);
   const router = useRouter();
   const { id } = useLocalSearchParams(); // Pega o ID da empresa da URL

   // Busca os dados da empresa ao carregar a tela
   useEffect(() => {
      if (id) {
         setLoading(true);
         api.get(`/empresas/${id}`)
            .then(response => {
               if (response.data && response.data) {
                  setInitialData(response.data);
               }
            })
            .catch(error => console.error("Erro ao buscar dados da empresa:", error))
            .finally(() => setLoading(false));
      }
   }, [id]);

   const handleUpdateEmpresa = async (data: EmpresaFormData) => {
      setLoading(true);
      try {
         await api.put(`/empresas/`, data);
         router.back(); // Volta para a lista após a atualização
      } catch (error) {
         console.error("Erro ao atualizar empresa:", error);
         // Adicionar feedback de erro
      } finally {
         setLoading(false);
      }
   };

   if (loading && !initialData) {
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
               isLoading={loading}
               onSubmit={handleUpdateEmpresa}
               initialData={initialData} // Passa os dados para preencher o formulário
               submitButtonLabel="Salvar Alterações"
            />
         </View>
      </ScreenContainer>
   );
};

export default EditEmpresaScreen;