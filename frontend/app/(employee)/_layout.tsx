import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
// 1. Importe os componentes necessários
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';
import { useWindowDimensions } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

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
               width: isDesktop ? '18%' : '80%',
            },
            swipeEnabled: !isDesktop, // Desabilita o gesto de arrastar no desktop

            drawerActiveTintColor: theme.colors.onPrimaryContainer, // Letra e Ícone ATIVO (Azul escuro)
            drawerInactiveTintColor: '#FFFFFF',                     // Letra e Ícone INATIVO (Branco)
            drawerActiveBackgroundColor: theme.colors.primaryContainer, // Fundo ATIVO (Azul clarinho)
            drawerInactiveBackgroundColor: 'transparent',
            // 2. Use o novo CustomHeader, passando a informação se é desktop
            header: ({ options }) => <CustomHeader title={options.title || 'Área do Funcionário'} isDesktop={isDesktop} />,
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
               drawerLabel: 'Solicitar Ajuste',
               title: 'Solicitar Ajuste',
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

      </Drawer>
   );
}