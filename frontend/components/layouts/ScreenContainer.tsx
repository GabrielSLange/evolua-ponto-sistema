import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

interface ScreenContainerProps {
   children: React.ReactNode;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ children }) => {
   // Hook para pegar as dimensões da tela em tempo real
   const { width } = useWindowDimensions();
   const theme = useTheme();

   // Define um ponto de quebra (breakpoint). Telas mais largas que isso serão consideradas "desktop".
   const isDesktop = Platform.OS === 'web' && width > 768;

   return (
      <ScrollView
         style={[styles.outerContainer, { backgroundColor: theme.colors.background }]}
         contentContainerStyle={styles.scrollContentContainer}
      >
         <View style={[styles.innerContainer, isDesktop && styles.desktopContainer, { backgroundColor: theme.colors.background }]}>
            {children}
         </View>
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   outerContainer: {
      flex: 1, // Garante que a área de rolagem ocupe a tela toda
   },
   // 3. Este estilo controla o container *dentro* da área de rolagem
   scrollContentContainer: {
      alignItems: 'center', // Centraliza o innerContainer
      flexGrow: 1,          // Garante que o conteúdo possa crescer
   },
   innerContainer: {
      width: '100%',
      flex: 1, // Faz o conteúdo ocupar o espaço disponível dentro do container centralizado
   },
   desktopContainer: {
      maxWidth: '70%', // A mesma lógica de antes para limitar a largura
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#e0e0e0', // Adiciona um fundo branco para o conteúdo
   },
});

export default ScreenContainer;