import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import ListEstabelcimentos from '@/components/lists/listEstabelecimentos';
import { useEstabelecimentos } from '@/hooks/admin/useEstabelecimento';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

const AdminDashboardScreen = () => {
   const { userId } = useLocalSearchParams<{ userId: string }>();
   const { colors } = useTheme();

   const { estabelecimentos, loading, nomeEmpresa, empresaId, toggleEstabelecimentoAtivo } = useEstabelecimentos(userId || null);


   return (
      <ScreenContainer>
         <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Appbar.Header>
               <Appbar.Content title={`Estabelecimentos de ${nomeEmpresa}`} />
            </Appbar.Header>
            <ListEstabelcimentos
               estabelecimentos={estabelecimentos}
               permissao="admin"
               userId={userId}
               empresaId={empresaId}
               toggleEstabelecimentoAtivo={toggleEstabelecimentoAtivo}
            />
         </View>
         <Modal
            transparent={true}
            animationType="fade"
            visible={loading}
         >
            <View style={styles.loaderOverlay}>
               <CustomLoader />
            </View>
         </Modal>
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


export default AdminDashboardScreen;