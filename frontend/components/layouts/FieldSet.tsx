import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface FieldsetProps {
  legend?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const Fieldset = ({ legend, children, style, titleStyle }: FieldsetProps) => {
  const theme = useTheme();

  return (
    <View style={[
      styles.container, 
      { 
        borderColor: theme.colors.outline, // Cor da borda dinâmica
        backgroundColor: 'transparent' // Garante que o fundo do container seja transparente
      }, 
      style
    ]}>
      {/* O Título (Legend) */}
      {legend && (
        <View style={[
          styles.labelContainer, 
          { backgroundColor: theme.colors.background } // <--- O PULO DO GATO: Fundo igual ao da tela
        ]}>
          <Text variant="labelMedium" style={[
            { color: theme.colors.primary, fontWeight: 'bold' }, // Cor do texto dinâmica
            titleStyle
          ]}>
            {legend}
          </Text>
        </View>
      )}

      {/* O Conteúdo */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    marginTop: 10,
    position: 'relative', // Necessário para o posicionamento absoluto do título
  },
  labelContainer: {
    position: 'absolute',
    top: -10, // Sobe o texto para ficar na linha da borda
    left: 10,
    paddingHorizontal: 4, // Um respiro nas laterais para cobrir a linha
    zIndex: 1, // Garante que fique por cima da borda
  },
  content: {
    marginTop: 4,
  }
});