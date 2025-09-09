import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';
import { useNotification } from '../../../contexts/NotificationContext';
import EstabelecimentoForm, { EstabelecimentoFormData } from '../../../components/forms/EstabelecimentoForm';

const AddEstabelecimentoScreen = () => {
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { empresaId } = useLocalSearchParams(); // Pega o ID da empresa-mãe
   const { showNotification } = useNotification();

   const handleAdd = async (data: EstabelecimentoFormData) => {
      setLoading(true);
      try {
         await api.post('/estabelecimento', { ...data, empresaId });
         showNotification('Estabelecimento cadastrado com sucesso!', 'success');
         router.back();
      } catch (error) {
         showNotification('Erro ao cadastrar estabelecimento.', 'error');
      } finally {
         setLoading(false);
      }
   };

   return (
      <View style={{ flex: 1 }}>
         <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title="Novo Estabelecimento" />
         </Appbar.Header>
         <EstabelecimentoForm
            isLoading={loading}
            onSubmit={handleAdd}
            submitButtonLabel="Cadastrar"
         />
      </View>
   );
};

export default AddEstabelecimentoScreen;