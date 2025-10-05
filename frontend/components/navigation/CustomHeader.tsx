import React, { useState } from 'react';
import { Appbar, Menu, Switch, Text } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { View } from 'react-native';

// O nome da tela será passado como propriedade (prop)
interface CustomHeaderProps {
   title: string;
   isDesktop?: boolean; // Nova prop para indicar se é desktop ou não
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, isDesktop }: CustomHeaderProps) => {
   const navigation = useNavigation();
   const { theme, toggleTheme } = useAuth();
   const [menuVisible, setMenuVisible] = useState(false);

   const openMenu = () => setMenuVisible(true);
   const closeMenu = () => setMenuVisible(false);

   return (
      <Appbar.Header >
         {/* Ícone de Menu Lateral (Sanduíche) à Esquerda */}
         {!isDesktop && (
            <Appbar.Action
               icon="menu"
               onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            />
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
   );
};

export default CustomHeader;