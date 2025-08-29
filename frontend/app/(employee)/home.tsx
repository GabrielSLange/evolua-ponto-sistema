import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

const EmployeeHomeScreen = () => {
   return (
      <View style={styles.container}>
         <Text variant="headlineLarge">Área do Funcionário</Text>
         <Button mode="contained" style={{ marginTop: 20 }}>
            Registrar Ponto
         </Button>
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

export default EmployeeHomeScreen;