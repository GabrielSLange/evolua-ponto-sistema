import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

interface ScreenContainerProps {
   children: React.ReactNode;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ children }) => {
   // Hook para pegar as dimensões da tela em tempo real
   const { width } = useWindowDimensions();

   // Define um ponto de quebra (breakpoint). Telas mais largas que isso serão consideradas "desktop".
   const isDesktop = Platform.OS === 'web' && width > 768;

   return (
      <View style={styles.outerContainer}>
         <View style={[styles.innerContainer, isDesktop && styles.desktopContainer]}>
            {children}
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   // Container externo que preenche a tela e pode ter uma cor de fundo
   outerContainer: {
      flex: 1,
      backgroundColor: '#f5f5f5', // Uma cor de fundo suave para o app web
   },
   // Container interno que guarda o conteúdo
   innerContainer: {
      flex: 1,
      width: '100%',
   },
   // Estilo extra que só é aplicado em modo desktop
   desktopContainer: {
      maxWidth: '70%', // Largura máxima do conteúdo
      alignSelf: 'center', // Centraliza o container na tela
      backgroundColor: '#ffffff', // Fundo branco para a área de conteúdo
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#e0e0e0',
   },
});

export default ScreenContainer;