import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Appbar } from 'react-native-paper';
import { DrawerActions, useNavigation } from '@react-navigation/native';

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
         screenOptions={{
            header: ({ options }) => <CustomHeader title={options.title || 'Área do Funcionário'} />,
         }}
      >
         <Drawer.Screen
            name="home" // Link para o arquivo home.tsx
            options={{
               drawerLabel: 'Início',
               title: 'Início',
            }}
         />
         {/* Adicione outras telas do funcionário aqui no futuro */}
      </Drawer>
   );
}