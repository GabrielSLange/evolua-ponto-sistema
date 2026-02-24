import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Button, Divider, List, useTheme, Badge, Text } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { useBadge } from '../../contexts/BadgeContext';

const CustomDrawerContent = (props: any) => {
   const { role, userId, signOut } = useAuth();
   const theme = useTheme();
   const { pendingCount } = useBadge();

   const [isGestaoExpanded, setIsGestaoExpanded] = useState(false);
   const isAdmin = role === 'admin';

   const currentRouteName = props.state?.routes[props.state.index]?.name;

   const isEstabelecimentos = currentRouteName === 'estabelecimentos/index';
   const isEscalas = currentRouteName === 'escalas/index';
   const isSolicitacoes = currentRouteName === 'solicitacoes/index';
   const isFeriados = currentRouteName === 'feriados/index';
   const isRelatorios = currentRouteName === 'relatorios/index';
   const isHistorico = currentRouteName === 'historico-pontos/index';

   // 🔥 A MÁGICA ESTÁ AQUI: Essa função cria os itens garantindo que a cor não falhe!
   const renderNestedItem = (title: string, route: string, isActive: boolean, iconName: string, extraRight?: () => React.ReactNode) => {
      return (
         <List.Item
            title={title}
            onPress={() => router.push(route)}
            style={[
               styles.nestedItem,
               { backgroundColor: isActive ? theme.colors.primaryContainer : 'transparent', paddingLeft: 32 }
            ]}
            // Aqui o texto obedece cegamente: Ativo = Azul Escuro | Inativo = Branco
            titleStyle={{
               color: isActive ? theme.colors.onPrimaryContainer : '#FFFFFF',
               fontWeight: isActive ? 'bold' : 'normal',
               fontSize: 14,
            }}
            // O ícone obedece cegamente: Ativo = Azul Escuro | Inativo = Branco
            left={props => (
               <List.Icon 
                  {...props} 
                  icon={iconName} 
                  color={isActive ? theme.colors.onPrimaryContainer : '#FFFFFF'} 
                  style={{ marginLeft: 8 }} 
               />
            )}
            right={extraRight}
         />
      );
   };

   return (
      <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
         <DrawerContentScrollView {...props} >
            <DrawerItemList {...props} />

            {isAdmin && (
               <List.Accordion
                  title="Gestão"
                  expanded={isGestaoExpanded}
                  onPress={() => setIsGestaoExpanded(!isGestaoExpanded)}
                  style={{ backgroundColor: theme.colors.primary, paddingVertical: 3 }}
                  
                  // 1. Forçamos a cor do texto do Accordion ignorando o tema
                  titleStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                  
                  // 2. Forçamos a cor do ícone da engrenagem para #FFFFFF
                  left={props => <List.Icon {...props} icon="cog" color="#FFFFFF" style={{ marginLeft: 17 }} />}
                  
                  // 3. Forçamos a cor da setinha para #FFFFFF
                  right={props => 
                     (!isGestaoExpanded && pendingCount > 0)
                     ? <Badge size={8} style={{ alignSelf: 'center', marginRight: 16, backgroundColor: theme.colors.error }} />
                     : <List.Icon {...props} icon={isGestaoExpanded ? "chevron-up" : "chevron-down"} color="#FFFFFF" />
                  }
               >
                  {/* Olha como o código ficou muito mais limpo chamando a nossa função: */}
                  {renderNestedItem('Estabelecimentos', `/(admin)/estabelecimentos?userId=${userId}`, isEstabelecimentos, 'store')}
                  
                  {renderNestedItem('Escalas', '/(admin)/escalas', isEscalas, 'calendar-range')}
                  
                  {renderNestedItem('Solicitações', '/(admin)/solicitacoes', isSolicitacoes, 'check-circle-outline', 
                     () => pendingCount > 0 ? (
                        <View style={{ justifyContent: 'center', paddingRight: 16 }}>
                           <Badge size={20} style={{ backgroundColor: '#8f0404', color: '#FFFFFF', fontWeight: 'bold' }}>
                              {pendingCount > 99 ? '99+' : pendingCount}
                           </Badge>
                        </View>
                     ) : null
                  )}
                  
                  {renderNestedItem('Feriados', '/(admin)/feriados', isFeriados, 'calendar-star')}
                  
                  {renderNestedItem('Relatórios', '/(admin)/relatorios', isRelatorios, 'file-document-outline')}
                  
                  {renderNestedItem('Histórico de Pontos', '/(admin)/historico-pontos', isHistorico, 'history')}
               </List.Accordion>
            )}
         </DrawerContentScrollView>

         <View style={styles.bottomSection}>
            <Divider style={{ backgroundColor: 'transparent' }} />
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
   },
   nestedItem: {
      marginLeft: 10, 
      marginRight: 10,
      paddingVertical: 0,
      borderLeftWidth: 2,
      borderLeftColor: 'transparent',
      borderRadius: 50, 
   },
});

export default CustomDrawerContent;