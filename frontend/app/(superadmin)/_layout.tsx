import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, useWindowDimensions } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useTheme, Icon } from 'react-native-paper';

const breakpoint = 768;

export default function SuperAdminLayout() {
   const { width } = useWindowDimensions();
   const theme = useTheme();

   const isDesktop = width >= breakpoint;

   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            // 1. Configuração de Responsividade
            drawerType: isDesktop ? 'permanent' : 'front',

            // 2. Estilo do Drawer (25% no desktop para seguir o Admin)
            drawerStyle: {
               width: isDesktop ? '25%' : '80%',
               borderRightColor: theme.colors.outlineVariant,
               borderRightWidth: StyleSheet.hairlineWidth,
            },
            swipeEnabled: !isDesktop,

            // 3. Cores e Tipografia (Padrão Azul/Branco do Admin)
            drawerActiveTintColor: theme.colors.onPrimaryContainer,
            drawerInactiveTintColor: '#FFFFFF',
            drawerActiveBackgroundColor: theme.colors.primaryContainer,
            drawerInactiveBackgroundColor: 'transparent',

            // 4. Header Customizado
            header: ({ options }) => (
               <CustomHeader 
                  title={options.title || 'Painel Super Admin'} 
                  isDesktop={isDesktop} 
               />
            ),
         }}
      >
         {/* ITEM VISÍVEL NO MENU */}
         <Drawer.Screen
            name="empresas/index"
            options={{
               drawerLabel: 'Gerenciar Empresas',
               title: 'Gerenciar Empresas',
               drawerIcon: ({ color, size }) => (
                  <Icon source="domain" color={color} size={size} />
               )
            }}
         />

         {/* TELAS OCULTAS (Configuradas com display: 'none') */}
         <Drawer.Screen
            name="empresas/add-empresa"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Adicionar Empresa',
            }}
         />
         <Drawer.Screen
            name="empresas/edit-empresa"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Editar Empresa',
            }}
         />
         <Drawer.Screen
            name="estabelecimentos/index"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Estabelecimentos',
            }}
         />
         <Drawer.Screen
            name="estabelecimentos/edit-estabelecimento"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Editar Estabelecimento',
            }}
         />
         <Drawer.Screen
            name="estabelecimentos/add-estabelecimento"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Adicionar Estabelecimento',
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
            name='escalas/index'
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Gestão de Escalas'
            }}
         />
         <Drawer.Screen
            name="escalas/add-escala"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Nova Escala',
            }}
         />
         <Drawer.Screen
            name="escalas/edit-escala"
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Editar Escala',
            }}
         />
      </Drawer>
   );
}