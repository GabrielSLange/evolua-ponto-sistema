import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Appbar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
// Importa o nosso menu customizado
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';

// Componente customizado para o cabeçalho
const CustomHeader = ({ title }: { title: string }) => {
   const navigation = useNavigation();
   return (
      <Appbar.Header>
         <Appbar.Action
            icon="menu"
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
         />
         <Appbar.Content title={title} />
      </Appbar.Header>
   );
};

export default function SuperAdminLayout() {
   return (
      <Drawer
         // **Verifique se esta linha está presente e correta**
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Super Admin'} />,
         }}
      >
         <Drawer.Screen
            name="index"
            options={{
               drawerLabel: 'Gerenciar Empresas',
               title: 'Gerenciar Empresas',
            }}
         />
      </Drawer>
   );
}