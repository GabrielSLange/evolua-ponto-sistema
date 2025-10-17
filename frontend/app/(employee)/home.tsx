import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import CustomLoader from '../../components/CustomLoader'; // Importa nosso loader

const EmployeeHomeScreen = () => {
   // 1. Cria um estado de carregamento para esta tela específica
   const [isPageLoading, setPageLoading] = useState(true);

   // 2. Usa o useEffect para simular o carregamento de dados
   useEffect(() => {
      // Simula uma chamada de API que demora 3 segundos
      const timer = setTimeout(() => {
         setPageLoading(false); // Após 3 segundos, para de carregar
      }, 20);

      // Limpa o timer se o componente for desmontado (boa prática)
      return () => clearTimeout(timer);
   }, []); // O array vazio [] faz com que o useEffect rode apenas uma vez

   // 3. Renderização condicional
   if (isPageLoading) {
      // Se estiver carregando, mostra o loader
      return <CustomLoader />;
   }

   // Se não estiver carregando, mostra o conteúdo da página
   return (
      <View style={styles.container}>
         {/* <View >
            <Text variant="headlineLarge">Área do Funcionário</Text>
         </View>
         <Text variant="headlineLarge">Área do Funcionário</Text>
         <Text style={styles.subtitle}>Conteúdo carregado!</Text>
         <Button mode="contained" style={{ marginTop: 20 }}>
            Registrar Ponto
         </Button> */}
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center', // Centraliza o conteúdo
   },
   subtitle: {
      marginTop: 8,
      fontSize: 16,
   }
})

export default EmployeeHomeScreen;