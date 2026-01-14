import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Button, Divider, Drawer, List, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

// Este componente recebe todas as props do Drawer e as repassa para o DrawerItemList
const CustomDrawerContent = (props: any) => {
   const { role, userId, signOut } = useAuth();
   const theme = useTheme();

   // Estado exclusivo para o Admin
   const [isGestaoExpanded, setIsGestaoExpanded] = useState(false);

   // Verifica se é admin
   const isAdmin = role === 'admin';

   return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
         <DrawerContentScrollView {...props} >
            {/* Renderiza todos os itens de menu padrão (definidos nos _layout.tsx) */}
            <DrawerItemList {...props} />

            {/* Itens adicionais exclusivos para Admin */}
            {isAdmin && (
               <>
                  <List.Accordion
                     title="Gestão"
                     expanded={isGestaoExpanded}
                     onPress={() => setIsGestaoExpanded(!isGestaoExpanded)}
                     style={{ borderRadius: 56, paddingVertical: 3 }}
                     titleStyle={{ color: theme.colors.onSurface }}
                  >
                     <Drawer.Item
                        label='Estabelecimentos'
                        onPress={() => router.push(`/(admin)/estabelecimentos?userId=${userId}`)}
                        style={styles.nestedItem}
                     />

                     <Drawer.Item
                        label="Escalas"
                        onPress={() => router.push('/(admin)/escalas')}
                        style={styles.nestedItem}
                     />

                     <Drawer.Item
                        label="Solicitações"
                        onPress={() => router.push('/(admin)/solicitacoes')}
                        style={styles.nestedItem}
                     />

                     <Drawer.Item
                        label="Feriados"
                        onPress={() => router.push('/(admin)/feriados')}
                        style={styles.nestedItem}
                     />

                     <Drawer.Item
                        label="Relatórios"
                        onPress={() => router.push('/(admin)/relatorios')}
                        style={styles.nestedItem}
                     />
                  </List.Accordion>
               </>
            )}
         </DrawerContentScrollView>

         {/* Seção inferior do menu */}
         <View style={[styles.bottomSection, { borderTopColor: theme.colors.outlineVariant }]}>
            <Divider />
            <Button
               icon="logout"
               onPress={() => signOut()}
               style={styles.logoutButton}
               mode="contained"
               buttonColor={theme.colors.error}
            >
               Sair
            </Button>
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   bottomSection: {
      padding: 16,
   },
   logoutButton: {
      marginTop: 10,
      backgroundColor: '#E57373',
   },
   nestedItem: {
      marginLeft: 10, 
      paddingVertical: 0,
      borderLeftWidth: 2,
      borderLeftColor: 'transparent',
   },
});

export default CustomDrawerContent;