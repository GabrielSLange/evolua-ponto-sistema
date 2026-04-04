import React, { useState } from 'react';
import { Modal, StyleSheet, View } from "react-native";
import { Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useTodosFuncionarios } from '@/hooks/admin/useFuncionario';
import ListFuncionarios from '@/components/lists/listFuncionarios';
import { useAuth } from '@/contexts/AuthContext';

const TodosFuncionariosAdminScreen = () => {
   const router = useRouter();
   const { userId } = useAuth();
   const { funcionarios, loading, empresaId, toggleFuncionarioAtivo } = useTodosFuncionarios(userId || null);

   const handleBack = () => {
      if (empresaId) {
         router.push({
            pathname: '/(admin)/estabelecimentos', // Volta para os estabelecimentos por padrão ou outra tela?
            params: { userId: userId }
         });
      } else {
         router.back();
      }
   };

   return (
      <View style={{ flex: 1 }}>
         <Appbar.Header>
            <Appbar.BackAction onPress={handleBack} />
            <Appbar.Content title="Todos os Funcionários" />
         </Appbar.Header>
         <ScreenContainer>
            <View style={{ flex: 1 }}>
               
               <ListFuncionarios
                  funcionarios={funcionarios}
                  permissao="admin"
                  userId={userId}
                  empresaId={empresaId}
                  // Passamos estabelecimentoId undefined para indicar que é do "Todos"
                  toggleFuncionarioAtivo={toggleFuncionarioAtivo}
               />
               <Modal
                  transparent={true}
                  animationType="fade"
                  visible={loading}
               >
                  <View style={styles.loaderOverlay}>
                     <CustomLoader />
                  </View>
               </Modal>
            </View>
         </ScreenContainer>
      </View>
   );
};

const styles = StyleSheet.create({
   loaderOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
   },
});

export default TodosFuncionariosAdminScreen;
