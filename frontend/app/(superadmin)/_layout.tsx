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
            name="empresas/index"
            options={{
               drawerLabel: 'Gerenciar Empresas',
               title: 'Gerenciar Empresas',
            }}
         />
         <Drawer.Screen
            name="empresas/add-empresa"
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Adicionar Empresa',
            }}
         />
         <Drawer.Screen
            name="empresas/edit-empresa"
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Editar Empresa',
            }}
         />
         <Drawer.Screen
            name="estabelecimentos/estabelecimentos"
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Estabelecimentos',
            }}
         />
         <Drawer.Screen
            name="estabelecimentos/edit-estabelecimento"
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Editar Estabelecimento',
            }}
         />
         <Drawer.Screen
            name="estabelecimentos/add-estabelecimento"
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Adicionar Estabelecimento',
            }}
         />
      </Drawer>
   );
}