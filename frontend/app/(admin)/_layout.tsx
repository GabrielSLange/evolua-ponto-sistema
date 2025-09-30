import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
// 1. Importe os componentes necessários
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';

export default function AdminLayout() {
   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            // 2. Use o novo CustomHeader, passando o título da tela
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Admin'} />,
         }}
      >
         <Drawer.Screen
            name="estabelecimentos/index"
            options={{
               drawerLabel: 'Gerenciar Estabelecimentos',
               title: 'Gerenciar Empresas',
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
         <Drawer.Screen
            name="estabelecimentos/edit-estabelecimento"
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Editar Estabelecimento',
            }}
         />
         <Drawer.Screen name="relatorios" options={{ drawerLabel: 'Relatórios', title: 'Relatórios' }} />
      </Drawer>
   );
}