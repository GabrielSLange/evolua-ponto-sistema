import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Divider, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

// Este componente recebe todas as props do Drawer e as repassa para o DrawerItemList
const CustomDrawerContent = (props: any) => {
   const { signOut } = useAuth();

   return (
      <View style={{ flex: 1 }}>
         <DrawerContentScrollView {...props}>
            {/* Renderiza todos os itens de menu padrão (definidos nos _layout.tsx) */}
            <DrawerItemList {...props} />
         </DrawerContentScrollView>

         {/* Seção inferior do menu */}
         <View style={styles.bottomSection}>
            <Divider />
            <Button
               icon="logout"
               onPress={() => signOut()}
               style={styles.logoutButton}
               mode="contained"
               buttonColor="#000"
               textColor="#fff"
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
      borderTopColor: '#f4f4f4',
      borderTopWidth: 1,
   },
   logoutButton: {
      marginTop: 10,
   },
});

export default CustomDrawerContent;