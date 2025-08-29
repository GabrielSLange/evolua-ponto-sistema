import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const AdminDashboardScreen = () => {
   return (
      <View style={styles.container}>
         <Text variant="headlineLarge">Bem-vindo, Admin!</Text>
         <Text>Este é o seu dashboard.</Text>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 16,
      alignItems: 'center'
   }
})

export default AdminDashboardScreen;