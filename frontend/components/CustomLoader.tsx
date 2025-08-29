import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const CustomLoader = () => {
   return (
      <View style={styles.container}>
         <LottieView
            // Certifique-se que o nome do arquivo corresponde ao que você baixou
            source={require('../assets/fingerprint.json')}
            style={styles.animation}
            autoPlay
            loop
         />
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF', // Fundo branco sólido
   },
   animation: {
      width: 200,
      height: 200,
   },
});

export default CustomLoader;