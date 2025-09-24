import React from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import EstabelecimentoForm from '../../../components/forms/EstabelecimentoForm';
import { useAddEstabelecimento } from '@/hooks/superadmin/useEstabelecimento';
import ScreenContainer from '@/components/layouts/ScreenContainer';

const AddEstabelecimentoScreen = () => {
   const router = useRouter();
   const { empresaId, empresaNome } = useLocalSearchParams(); // Pega o ID da empresa-mãe

   const { loading, addEstabelecimento } = useAddEstabelecimento(empresaId as string);

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.push(`/estabelecimentos?empresaId=${empresaId}&empresaNome=${empresaNome}`)} />
               <Appbar.Content title="Novo Estabelecimento" />
            </Appbar.Header>
            <EstabelecimentoForm
               isLoading={loading}
               onSubmit={addEstabelecimento}
               submitButtonLabel="Cadastrar"
            />
         </View>
      </ScreenContainer>
   );
};

export default AddEstabelecimentoScreen;