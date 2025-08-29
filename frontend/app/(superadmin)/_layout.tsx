import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

// Layout simples para o painel do Super Admin
export default function SuperAdminLayout() {
   return (
      <Drawer>
         <Drawer.Screen
            name="index" // Aponta para o arquivo index.tsx
            options={{
               drawerLabel: 'Gerenciar Empresas',
               title: 'Gerenciar Empresas',
            }}
         />
      </Drawer>
   );
}