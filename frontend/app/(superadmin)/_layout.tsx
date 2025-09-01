import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
// 1. Importe os componentes necessários
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';

export default function SuperAdminLayout() {
   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            // 2. Use o novo CustomHeader
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
         <Drawer.Screen
            name="add-empresa" // Nome do arquivo: add-empresa.tsx
            options={{
               drawerLabel: () => null, // Esta função vazia oculta o item do menu
               title: 'Adicionar Empresa', // Este será o título no cabeçalho da página
            }}
         />
         <Drawer.Screen
            name="edit-empresa"
            options={{
               drawerLabel: () => null,
               title: 'Editar Empresa',
            }}
         />
      </Drawer>
   );
}