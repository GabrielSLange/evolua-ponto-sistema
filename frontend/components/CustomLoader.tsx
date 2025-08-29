import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const CustomLoader = () => {
   return (
      // Container principal (tela cheia com fundo translúcido)
      <View style={styles.container}>
         {/* NOVO: Container que define o tamanho da animação */}
         <View style={styles.animationWrapper}>
            <LottieView
               source={require('../assets/fingerprint2.json')}
               // A animação agora ocupa 100% do seu container pai (o wrapper)
               style={{ width: '100%', height: '100%' }}
               autoPlay
               loop
            />
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
   },
   // NOVO ESTILO: Este estilo agora controla o tamanho da animação.
   // Altere os valores de width e height aqui para ajustar o tamanho.
   animationWrapper: {
      width: 200, // <-- Altere aqui para o tamanho desejado
      height: 200, // <-- Altere aqui para o tamanho desejado
   },
});

export default CustomLoader;