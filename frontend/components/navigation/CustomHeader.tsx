import React, { useState } from 'react';
import { Appbar, Badge, Divider, Menu, Switch, Text, useTheme, Avatar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { View } from 'react-native';
import { useBadge } from '@/contexts/BadgeContext';
import { router } from 'expo-router';

// O nome da tela será passado como propriedade (prop)
interface CustomHeaderProps {
   title: string;
   isDesktop?: boolean; // Nova prop para indicar se é desktop ou não
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, isDesktop }: CustomHeaderProps) => {
   const navigation = useNavigation();
   const { theme, toggleTheme } = useAuth();
   const [menuVisible, setMenuVisible] = useState(false);
   const { pendingCount } = useBadge();
   const { role } = useAuth();

   const themes = useTheme();
   

   const openMenu = () => setMenuVisible(true);
   const closeMenu = () => setMenuVisible(false);

   const handleNavigation = (route: string) => {
       closeMenu();
       router.push(route as any);
   };

   return (
      <View>
      <Appbar.Header >
         {/* Ícone de Menu Lateral (Sanduíche) à Esquerda */}
         {!isDesktop && (
            <View style={{ marginRight: 10 }}>
            <Appbar.Action
               icon="menu"
               onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            />
            {/* 3. O Badge Flutuante */}
            {pendingCount > 0 && (
               <Badge
                  size={16}
                  style={{
                  position: 'absolute',
                  top: 6,      // Ajuste fino vertical
                  right: 6,    // Ajuste fino horizontal
                  backgroundColor: themes.colors.error,
                  color: themes.colors.surface,
                  fontWeight: 'bold',
                  zIndex: 10
                  }}
               >
                  {pendingCount > 99 ? '99+' : pendingCount}
               </Badge>
            )}
            </View>
         )}
         {/* Título no Meio */}
         <Appbar.Content title={title} />

         {/* Ícone de Usuário com Menu Suspenso à Direita */}
         <Menu
               visible={menuVisible}
               onDismiss={closeMenu}
               anchor={
                  <Appbar.Action 
                     icon="account-circle-outline" // Ícone mais moderno
                     color={themes.colors.primary} 
                     onPress={openMenu} 
                  />
               }
               // Desloca o menu um pouco para baixo para não colar no topo
               contentStyle={{ 
                  marginTop: 40, // Ajuste esse valor se quiser mais para baixo ou para cima
                  borderRadius: 12,
                  width: 260, // Largura fixa impede que o menu "vaze" para a direita
                  paddingBottom: 8
               }} 
            >
               {/* Cabeçalho do Menu (Opcional - Mostra quem está logado) */}
               <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar.Icon size={32} icon="account" style={{ marginRight: 10 }} />
                    <View>
                        <Text variant="labelLarge">Minha Conta</Text>
                        <Text variant="bodySmall" style={{ color: themes.colors.outline }}>
                            Configurações
                        </Text>
                    </View>
               </View>

               <Divider />

               {/* Opções de Navegação */}
               <Menu.Item 
                  leadingIcon="card-account-details-outline" 
                  onPress={() => handleNavigation('/perfil/dados-pessoais')} 
                  title="Dados Pessoais" 
               />
               
               <Menu.Item 
                  leadingIcon="lock-reset" 
                  onPress={() => handleNavigation('/perfil/alterar-senha')} 
                  title="Alterar Senha" 
               />

               <Menu.Item 
                  leadingIcon="email-edit-outline" 
                  onPress={() => handleNavigation('/perfil/alterar-email')} 
                  title="Alterar E-mail" 
               />

               <Divider />

               {/* Toggle de Tema */}
               <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 10 
               }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Appbar.Action icon={theme === 'dark' ? "weather-night" : "weather-sunny"} size={20} />
                     <Text variant="bodyMedium">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</Text>
                  </View>
                  <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
               </View>

            </Menu>
      </Appbar.Header>
      <Divider />
      </View>
   );
};

export default CustomHeader;