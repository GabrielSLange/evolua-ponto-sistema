import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet } from 'react-native';
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';

const breakpoint = 768;

export default function FiscalLayout() {
   const { width } = useWindowDimensions();
   const theme = useTheme();

   const isDesktop = width >= breakpoint;

   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            drawerType: isDesktop ? 'permanent' : 'front',
            drawerStyle: {
               width: isDesktop ? '25%' : '80%',
               borderRightColor: theme.colors.outlineVariant,
               borderRightWidth: StyleSheet.hairlineWidth,
            },
            swipeEnabled: !isDesktop,

            drawerActiveTintColor: theme.colors.onPrimaryContainer,
            drawerInactiveTintColor: '#FFFFFF',
            drawerActiveBackgroundColor: theme.colors.primaryContainer,
            drawerInactiveBackgroundColor: 'transparent',
            
            header: ({ options }) => <CustomHeader title={options.title || 'Painel Fiscal'} isDesktop={isDesktop} />,
         }}
      >
         {/* ITEM VISÍVEL 1: Tela Inicial (Lista de Provas) */}
         <Drawer.Screen
            name="index"
            options={{
               drawerLabel: 'Provas do Dia',
               title: 'Provas e Eventos',
               drawerIcon: ({ color, size }) => <Icon source="calendar-check" color={color} size={size} />
            }}
         />

         {/* ITEM VISÍVEL 2: Tela de Importação */}
         <Drawer.Screen
            name="importar"
            options={{
               drawerLabel: 'Importar Planilha',
               title: 'Importar Alunos',
               drawerIcon: ({ color, size }) => <Icon source="file-upload-outline" color={color} size={size} />
            }}
         />

         {/* TELA OCULTA NO MENU: Detalhes da Sala (Lista de Presença) */}
         <Drawer.Screen
            name="evento/[id]"
            options={{
               drawerItemStyle: { display: 'none' }, // Não aparece no menu lateral
               title: 'Lista de Presença',
            }}
         />
      </Drawer>
   );
}