import 'react-native-gesture-handler'; // Importante: deve ser a primeira linha
import { Drawer } from 'expo-router/drawer';
import { Appbar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';

// Componente customizado para o cabeçalho
const CustomHeader = ({ title }: { title: string }) => {
   const navigation = useNavigation();
   return (
      <Appbar.Header>
         {/* Ícone de menu que abre o drawer */}
         <Appbar.Action
            icon="menu"
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
         />
         <Appbar.Content title={title} />
      </Appbar.Header>
   );
};

// Layout principal do painel Admin
export default function AdminLayout() {
   return (
      <Drawer
         screenOptions={{
            // Define nosso cabeçalho customizado para todas as telas
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Admin'} />,
         }}
      >
         <Drawer.Screen
            name="index" // Aponta para o arquivo index.tsx
            options={{
               drawerLabel: 'Dashboard', // Texto no menu
               title: 'Dashboard',       // Texto no cabeçalho
            }}
         />
         <Drawer.Screen
            name="relatorios" // Aponta para o arquivo relatorios.tsx
            options={{
               drawerLabel: 'Relatórios', // Texto no menu
               title: 'Relatórios',       // Texto no cabeçalho
            }}
         />
      </Drawer>
   );
}