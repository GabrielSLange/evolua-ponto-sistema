import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Appbar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';

// Componente de cabeçalho reutilizável
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

// Layout principal do painel do funcionário
export default function EmployeeLayout() {
   return (
      <Drawer
         // A mágica acontece aqui:
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            header: ({ options }) => <CustomHeader title={options.title || 'Área do Funcionário'} />,
         }}
      >
         <Drawer.Screen name="home" options={{ drawerLabel: 'Início', title: 'Início' }} />
      </Drawer>
   );
}