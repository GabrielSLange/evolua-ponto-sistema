import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

const SuperAdminScreen = () => {
   return (
      <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
         <Text variant="headlineLarge">Painel do Super Admin</Text>
      </View>
   );
};

export default SuperAdminScreen;