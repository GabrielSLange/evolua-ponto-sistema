import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';
import { useNotification } from '../../../contexts/NotificationContext';
import EstabelecimentoForm from '../../../components/forms/EstabelecimentoForm';
import CustomLoader from '../../../components/CustomLoader';
import { ModelEstabelecimento } from '../../../models/ModelEstabelecimento';
import ScreenContainer from '@/components/layouts/ScreenContainer';

const EditEstabelecimentoScreen = () => {
   const [loading, setLoading] = useState(false);
   const [initialData, setInitialData] = useState<ModelEstabelecimento | undefined>(undefined);
   const router = useRouter();
   const { id, empresaId, empresaNome } = useLocalSearchParams();
   const { showNotification } = useNotification();

   useEffect(() => {
      if (id) {
         setLoading(true);
         api.get<{ data: ModelEstabelecimento }>(`/estabelecimento?estabelecimentoId=${id}`)
            .then(response => setInitialData(response.data.data))
            .catch(() => showNotification('Erro ao carregar dados.', 'error'))
            .finally(() => setLoading(false));
      }
   }, [id]);

   const handleUpdate = async (data: ModelEstabelecimento) => {
      setLoading(true);
      try {
         await api.put(`/estabelecimento/${id}`, data);
         showNotification('Estabelecimento atualizado com sucesso!', 'success');
         router.back();
      } catch (error) {
         showNotification('Erro ao atualizar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   if (loading && !initialData) return <CustomLoader />;

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push(`/(superadmin)/estabelecimentos/estabelecimentos?empresaId=${empresaId}&empresaNome=${empresaNome}`)} />
               <Appbar.Content title="Editar Estabelecimento" />
            </Appbar.Header>
            <EstabelecimentoForm
               isLoading={loading}
               onSubmit={handleUpdate}
               initialData={initialData}
               submitButtonLabel="Salvar Alterações"
            />
         </View>
      </ScreenContainer>
   );
};

export default EditEstabelecimentoScreen;