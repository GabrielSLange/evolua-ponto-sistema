import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
// 1. Importe os componentes necessários
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

const breakpoint = 768;

export default function AdminLayout() {
   const { width } = useWindowDimensions();
   const theme = useTheme();

   const isDesktop = width >= breakpoint;

   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            // 3. A MÁGICA ACONTECE AQUI:
            drawerType: isDesktop ? 'permanent' : 'front',

            // 4. Ajuste de estilo e comportamento para desktop vs. mobile
            drawerStyle: {
               // Define uma largura fixa no desktop e percentual no mobile
               width: isDesktop ? '25%' : '80%',
            },
            swipeEnabled: !isDesktop, // Desabilita o gesto de arrastar no desktop

            drawerActiveTintColor: theme.colors.primary,
            drawerInactiveTintColor: theme.colors.onSurface,
            drawerLabelStyle: { fontSize: 15 },
            drawerContentStyle: { backgroundColor: theme.colors.surface },
            // 2. Use o novo CustomHeader, passando o título da tela
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Admin'} isDesktop={isDesktop} />,
         }}
      >
         <Drawer.Screen
            name="estabelecimentos/index"
            options={{
               drawerLabel: 'Gerenciar Estabelecimentos',
               title: 'Gerenciar Estabelecimentos',
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
         <Drawer.Screen
            name='funcionarios/index'
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Funcionários',
            }}
         />
         <Drawer.Screen
            name='funcionarios/add-funcionario'
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Adicionar Funcionário',
            }}
         />
         <Drawer.Screen
            name='funcionarios/edit-funcionario'
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Editar Funcionário',
            }}
         />
         <Drawer.Screen
            name='funcionarios/details-funcionario'
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Detalhes do Funcionário',
            }}
         />
         <Drawer.Screen name="relatorios" options={{ drawerLabel: 'Relatórios', title: 'Relatórios' }} />
      </Drawer>
   );
}