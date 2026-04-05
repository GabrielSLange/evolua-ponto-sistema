import React, { useState } from 'react';
import { Modal, StyleSheet, View } from "react-native";
import { Text, useTheme, Divider } from 'react-native-paper';
import CustomLoader from '@/components/CustomLoader';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useTodosFuncionarios } from '@/hooks/admin/useFuncionario';
import ListFuncionarios from '@/components/lists/listFuncionarios';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollView } from 'react-native-gesture-handler';

const TodosFuncionariosAdminScreen = () => {
   const { userId } = useAuth();
   const theme = useTheme();
   const { funcionarios, loading, empresaId, nomeEmpresa, toggleFuncionarioAtivo } = useTodosFuncionarios(userId || null);

   return (
      <View style={{ flex: 1 }}>
         <ScreenContainer>
            <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.colors.background }}>
               <View style={{ marginBottom: 8 }}>
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                     {nomeEmpresa || "Carregando..."}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                     Visualize todos os funcionários da sua empresa e gerencie-os.
                  </Text>
               </View>

               <Divider style={{ marginVertical: 16 }} />

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
            </ScrollView>
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
