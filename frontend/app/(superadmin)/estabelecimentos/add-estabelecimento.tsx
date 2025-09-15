import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../../services/api';
import { useNotification } from '../../../contexts/NotificationContext';
import EstabelecimentoForm from '../../../components/forms/EstabelecimentoForm';
import { ModelEstabelecimento } from '@/models/ModelEstabelecimento';

const AddEstabelecimentoScreen = () => {
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { empresaId, empresaNome } = useLocalSearchParams(); // Pega o ID da empresa-mãe
   const { showNotification } = useNotification();

   const handleAdd = async (data: ModelEstabelecimento) => {
      setLoading(true);
      try {
         console.log(empresaId);
         data.empresaId = String(empresaId);
         await api.post('/Estabelecimento', { ...data });
         showNotification('Estabelecimento cadastrado com sucesso!', 'success');
         router.back();
      } catch (error) {
         showNotification('Erro ao cadastrar estabelecimento.', 'error');
         // console.error(error);
      } finally {
         setLoading(false);
      }
   };

   return (
      <View style={{ flex: 1 }}>
         <Appbar.Header>
            <Appbar.BackAction onPress={() => router.push(`/estabelecimentos/estabelecimentos?empresaId=${empresaId}&empresaNome=${empresaNome}`)} />
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