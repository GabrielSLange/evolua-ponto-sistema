import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Button, Divider, Drawer, List, useTheme, Badge, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { useBadge } from '../../contexts/BadgeContext';

const CustomDrawerContent = (props: any) => {
   const { role, userId, signOut } = useAuth();
   const theme = useTheme();
   const { pendingCount } = useBadge(); 

   console.log("ADMIN DRAWER - Pending Count:", pendingCount);

   const [isGestaoExpanded, setIsGestaoExpanded] = useState(false);
   const isAdmin = role === 'admin';

   return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
         <DrawerContentScrollView {...props} >
            <DrawerItemList {...props} />

            {isAdmin && (
               <>
                  <List.Accordion
                     title="Gestão"
                     expanded={isGestaoExpanded}
                     onPress={() => setIsGestaoExpanded(!isGestaoExpanded)}
                     style={{ borderRadius: 56, paddingVertical: 3 }}
                     titleStyle={{ color: theme.colors.onSurface }}
                     right={props => 
                        (!isGestaoExpanded && pendingCount > 0)
                        ? <Badge size={8} style={{ alignSelf: 'center', marginRight: 16, backgroundColor: theme.colors.error, color: theme.colors.surface }} />
                        : <List.Icon {...props} icon={isGestaoExpanded ? "chevron-up" : "chevron-down"} />
                     }
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

                     {/* --- CORREÇÃO AQUI --- */}
                     {/* O label volta a ser texto puro (String) para parar o erro */}
                     {/* Usamos a prop 'right' para renderizar o Badge na direita */}
                     <Drawer.Item
                        label="Solicitações"
                        right={() => (
                           pendingCount > 0 ? (
                              <View style={{ justifyContent: 'center', paddingRight: 8 }}>
                                 <Badge 
                                    size={20} 
                                    style={{ 
                                       backgroundColor: theme.colors.error, 
                                       color: theme.colors.surface, 
                                       fontWeight: 'bold' 
                                    }}
                                 >
                                    {pendingCount > 99 ? '99+' : pendingCount}
                                 </Badge>
                              </View>
                           ) : null
                        )}
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