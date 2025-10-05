import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

const breakpoint = 768;

export default function SuperAdminLayout() {
   const { width } = useWindowDimensions();
   const theme = useTheme();

   const isDesktop = width >= breakpoint;

   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            // 4. A MÁGICA ACONTECE AQUI:
            drawerType: isDesktop ? 'permanent' : 'front',

            // 5. Ajuste de estilo e comportamento para desktop vs. mobile
            drawerStyle: {
               // Define uma largura fixa no desktop e percentual no mobile
               width: isDesktop ? '30%' : '80%',
            },
            swipeEnabled: !isDesktop, // Desabilita o gesto de arrastar no desktop

            drawerActiveTintColor: theme.colors.primary,
            drawerInactiveTintColor: theme.colors.onSurface,
            drawerLabelStyle: { fontSize: 15 },
            drawerContentStyle: { backgroundColor: theme.colors.surface },

            // 6. Use o novo CustomHeader
            // Como você já tem um header customizado, a lógica de esconder o botão "sanduíche"
            // provavelmente precisará ser feita dentro do seu componente CustomHeader,
            // passando 'isDesktop' como uma propriedade (prop) para ele.
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Super Admin'} isDesktop={isDesktop} />,
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
            name="estabelecimentos/index"
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
         <Drawer.Screen
            name='funcionarios/index'
            options={{
               // **CORREÇÃO APLICADA AQUI**
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Funcionários',
            }}
         />
         <Drawer.Screen
            name='funcionarios/add-funcionario'
            options={{
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Adicionar Funcionário',
            }}
         />
         <Drawer.Screen
            name='funcionarios/edit-funcionario'
            options={{
               drawerItemStyle: { display: 'none' }, // Remove completamente o item do menu
               title: 'Editar Funcionário',
            }}
         />
      </Drawer>
   );
}