import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
// 1. Importe os componentes necessários
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

const breakpoint = 768;

export default function EmployeeLayout() {
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
            // 2. Use o novo CustomHeader
            header: ({ options }) => <CustomHeader title={options.title || 'Área do Funcionário'} />,
         }}
      >
         <Drawer.Screen 
            name="home" 
            options={{ 
               drawerLabel: 'Início', 
               title: 'Início' 
            }} 
         />

         <Drawer.Screen
            name="bater-ponto"
            options={{
               drawerLabel: 'Bater-ponto',
               title: 'Bater-ponto'
            }}
         />

         <Drawer.Screen
            name="comprovantes"
            options={{
               drawerLabel: 'Comprovantes',
               title: 'Comprovantes',
            }}
         />

      </Drawer>
   );
}