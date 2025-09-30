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
         <Drawer.Screen name="relatorios" options={{ drawerLabel: 'Relatórios', title: 'Relatórios' }} />
         <Drawer.Screen name="estabelecimentos" options={{ drawerLabel: 'Estabelecimentos', title: 'Estabelecimentos' }} />
         {/* Pode apagar a tela de configurações daqui */}
         {/* <Drawer.Screen name="configuracoes" options={{ drawerLabel: 'Configurações', title: 'Configurações' }} /> */}
      </Drawer>
   );
}