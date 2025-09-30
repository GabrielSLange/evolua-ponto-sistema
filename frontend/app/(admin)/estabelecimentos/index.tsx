import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import ListEstabelcimentos from '@/components/lists/listEstabelecimentos';
import { useEstabelecimentos } from '@/hooks/admin/useEstabelecimento';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';

const AdminDashboardScreen = () => {
   const { userId } = useLocalSearchParams<{ userId: string }>();

   const { estabelecimentos, loading, nomeEmpresa, empresaId, toggleEstabelecimentoAtivo } = useEstabelecimentos(userId || null);

   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.Content title={`Estabelecimentos de ${nomeEmpresa}`} />
            </Appbar.Header>
            <ListEstabelcimentos
               estabelecimentos={estabelecimentos}
               loading={loading}
               permissao="admin"
               userId={userId}
               empresaId={empresaId}
               toggleEstabelecimentoAtivo={toggleEstabelecimentoAtivo}
            />
         </View>
      </ScreenContainer>
   );
};


export default AdminDashboardScreen;