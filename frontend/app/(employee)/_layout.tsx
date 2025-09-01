import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
// 1. Importe os componentes necessários
import CustomDrawerContent from '../../components/navigation/CustomDrawerContent';
import CustomHeader from '../../components/navigation/CustomHeader';

export default function EmployeeLayout() {
   return (
      <Drawer
         drawerContent={(props) => <CustomDrawerContent {...props} />}
         screenOptions={{
            // 2. Use o novo CustomHeader
            header: ({ options }) => <CustomHeader title={options.title || 'Área do Funcionário'} />,
         }}
      >
         <Drawer.Screen name="home" options={{ drawerLabel: 'Início', title: 'Início' }} />
      </Drawer>
   );
}