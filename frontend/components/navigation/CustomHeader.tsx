import React, { useState } from 'react';
import { Appbar, Badge, Divider, Menu, Switch, Text, useTheme } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { View } from 'react-native';
import { useBadge } from '@/contexts/BadgeContext';

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

   const themes = useTheme();
   

   const openMenu = () => setMenuVisible(true);
   const closeMenu = () => setMenuVisible(false);

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
            // O "anchor" é o elemento que o menu usa como referência para aparecer
            anchor={<Appbar.Action icon="account-circle" onPress={openMenu} />}
         >
            <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
               <Text>Tema {theme === "dark" ? "Escuro" : "Claro"}  </Text>
               <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
            </View>
         </Menu>
      </Appbar.Header>
      <Divider />
      </View>
   );
};

export default CustomHeader;