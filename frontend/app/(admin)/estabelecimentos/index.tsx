import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import ListEstabelcimentos from '@/components/lists/listEstabelecimentos';
import { useAuth } from '@/contexts/AuthContext';
import { useEstabelecimentos } from '@/hooks/admin/useEstabelecimento';
import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Appbar, useTheme, Divider, Text } from 'react-native-paper';

const AdminDashboardScreen = () => {
   const { userId } = useAuth();
   const theme = useTheme();

   const { estabelecimentos, loading, nomeEmpresa, empresaId, toggleEstabelecimentoAtivo } = useEstabelecimentos(userId || null);


   return (
      <View style={{ flex: 1 }}>
         <ScreenContainer>
            <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.colors.background }}>
               <View style={{ marginBottom: 8 }}>
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                     {nomeEmpresa}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                     Visualize os estabelecimentos da sua empresa e gerencie-os.
                  </Text>
               </View>
               <Divider style={{ marginVertical: 16 }} />

               <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

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
            </ScrollView>
         </ScreenContainer>
      </View>
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