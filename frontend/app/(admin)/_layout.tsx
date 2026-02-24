import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';

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
               width: isDesktop ? '25%' : '80%',
               borderRightColor: theme.colors.outlineVariant,
               borderRightWidth: StyleSheet.hairlineWidth,
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
            name="meu-ponto/home"
            options={{
               drawerLabel: 'Início',
               title: 'Início',
               drawerIcon: ({ color, size }) => <Icon source="home" color={color} size={size} />
            }}
         />

         <Drawer.Screen
            name="meu-ponto/bater-ponto"
            options={{
               drawerLabel: 'Bater ponto',
               title: 'Bater ponto',
               drawerIcon: ({ color, size }) => <Icon source="clock-outline" color={color} size={size} />
            }}
         />

         <Drawer.Screen
            name="meu-ponto/solicitar-ponto"
            options={{
               drawerLabel: 'Inserir batida',
               title: 'Solicitar ponto',
               drawerIcon: ({ color, size }) => <Icon source="pencil-outline" color={color} size={size} />
            }}
         />

         <Drawer.Screen
            name="meu-ponto/comprovantes"
            options={{
               drawerLabel: 'Comprovantes',
               title: 'Comprovantes',
               drawerIcon: ({ color, size }) => <Icon source="file-document-outline" color={color} size={size} />
            }}
         />

         <Drawer.Screen
            name="estabelecimentos/index"
            options={{
               drawerLabel: 'Estabelecimentos',
               title: 'Estabelecimentos',
               drawerItemStyle: { display: 'none' },
               drawerIcon: ({ color, size }) => <Icon source="store" color={color} size={size} />
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
               title: 'Funcionários', // Título genérico, pois pode ser edição ou detalhes
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
         <Drawer.Screen
            name='solicitacoes/index'
            options={{
               drawerLabel: 'Solicitações',
               title: 'Solicitações',
               drawerItemStyle: { display: 'none' },
            }}
         />
         <Drawer.Screen
            name='relatorios/index'
            options={{
               drawerLabel: 'Relatórios',
               title: 'Relatórios',
               drawerItemStyle: { display: 'none' },
            }}
         />
         <Drawer.Screen
            name='feriados/index'
            options={{
               drawerLabel: 'Feriados',
               title: 'Gestão de Feriados',
               drawerItemStyle: { display: 'none' },
            }}
         />
         <Drawer.Screen
            name='feriados/add-feriado'
            options={{
               drawerItemStyle: { display: 'none' },
               title: 'Adicionar Feriado',
            }}
         />

         <Drawer.Screen
            name='historico-pontos/index'
            options={{
               drawerLabel: 'Histórico de Pontos',
               title: 'Histórico de Pontos',
               drawerItemStyle: { display: 'none' },
            }}
         />
      </Drawer>
   );
}