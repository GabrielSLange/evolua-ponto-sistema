import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Modal, Portal, Text, IconButton, ActivityIndicator, useTheme } from 'react-native-paper';

// Se for usar no mobile depois, vai precisar instalar: npx expo install react-native-webview
// import { WebView } from 'react-native-webview';
import Colors from '@/constants/Colors';

interface ComprovanteModalProps {
  visible: boolean;
  onDismiss: () => void;
  pdfUrl: string | null;
}

export const ComprovanteModal = ({ visible, onDismiss, pdfUrl }: ComprovanteModalProps) => {
  
  // Detecção se é Web para usar a tag HTML correta
  const isWeb = Platform.OS === 'web';
  
  const theme = useTheme();
  
  const containerStyle = { backgroundColor: theme.colors.background, padding: 20, margin: 20, borderRadius: 8, height: '90%' as const };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={containerStyle}>
        
        {/* Cabeçalho do Modal */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Text variant="titleLarge">Comprovante de Ponto</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {/* Corpo do Modal (Visualizador) */}
        <View style={styles.content}>
          {!pdfUrl ? (
            <ActivityIndicator animating={true} size="large" />
          ) : isWeb ? (
            // NA WEB: Usamos um iframe nativo do HTML
            // O TS pode reclamar do iframe, então fazemos um cast ou ignoramos
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Comprovante PDF"
            />
          ) : (
            // NO MOBILE: Usamos WebView (Descomente se for gerar app nativo)
            // <WebView source={{ uri: pdfUrl }} style={{ flex: 1 }} />
            <Text>Visualização em mobile requer react-native-webview</Text>
          )}
        </View>
        
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden', // Importante para o iframe não vazar as bordas arredondadas
  },
});