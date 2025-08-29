import 'react-native-gesture-handler'; // Importante: deve ser a primeira linha
import { Drawer } from 'expo-router/drawer';
import { Appbar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';

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
         // A mágica acontece aqui:
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Admin'} />,
         }}
      >
         <Drawer.Screen name="index" options={{ drawerLabel: 'Dashboard', title: 'Dashboard' }} />
         <Drawer.Screen name="relatorios" options={{ drawerLabel: 'Relatórios', title: 'Relatórios' }} />
      </Drawer>
   );
}