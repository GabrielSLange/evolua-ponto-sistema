import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const RelatoriosScreen = () => {
   return (
      <View style={styles.container}>
         <Text variant="headlineLarge">Página de Relatórios</Text>
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

export default RelatoriosScreen;