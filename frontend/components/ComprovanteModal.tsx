import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, IconButton, ActivityIndicator, Button, useTheme } from 'react-native-paper';
import { Document, Page, pdfjs } from 'react-pdf';
import CustomLoader from '@/components/CustomLoader';

// Configuração do Worker (Mantendo a versão 7 conforme conversamos)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ComprovanteModalProps {
  visible: boolean;
  onDismiss: () => void;
  pdfUrl: string | null;
}

export const ComprovanteModal = ({ visible, onDismiss, pdfUrl }: ComprovanteModalProps) => {
  const theme = useTheme();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(300);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  // NOVA FUNÇÃO DE DOWNLOAD DIRETO
  const handleDownload = async () => {
    if (!pdfUrl) return;
    setDownloading(true);

    try {
      // 1. Baixa o arquivo para a memória do navegador (Blob)
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      
      // 2. Cria uma URL interna temporária
      const url = window.URL.createObjectURL(blob);
      
      // 3. Cria o link invisível e clica nele
      const link = document.createElement('a');
      link.href = url;
      // Extrai um nome de arquivo ou gera um genérico
      link.download = `comprovante_ponto_${new Date().getTime()}.pdf`; 
      document.body.appendChild(link);
      link.click();
      
      // 4. Limpeza
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      alert("Erro ao iniciar download.");
    } finally {
      setDownloading(false);
    }
  };

  const containerStyle = { 
    backgroundColor: theme.colors.surface, 
    padding: 20, 
    margin: 20, 
    borderRadius: 8, 
    height: '85%',
    display: 'flex',
    flexDirection: 'column' as 'column',
    // Limita a largura máxima do modal no Desktop para ficar mais elegante
    maxWidth: 800, 
    alignSelf: 'center' as 'center',
    width: '90%'
  } as const;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={containerStyle}>
        
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={{color: theme.colors.onSurface}}>Comprovante</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {/* Corpo: Área do PDF */}
        <View 
            style={styles.content} 
            onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setContainerWidth(width);
            }}
        >
          {!pdfUrl ? (
            <ActivityIndicator animating={true} size="large" style={styles.loader} />
          ) : (
            <View style={styles.pdfScrollContainer}>
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<CustomLoaderModal />}
                    error={<Text style={{color: 'red', textAlign: 'center', marginTop: 20}}>Não foi possível carregar o PDF.</Text>}
                >
                    <Page 
                        pageNumber={1} 
                        width={Math.min(containerWidth, 500)} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                    />
                </Document>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
            <Button 
                mode="contained" 
                icon="download" 
                onPress={handleDownload}
                loading={downloading}
                disabled={downloading}
                style={{ width: '100%' }}
            >
                {downloading ? "Baixando..." : "Baixar Comprovante"}
            </Button>
        </View>
        
      </Modal>
    </Portal>
  );
};

const CustomLoaderModal = () => {
  const theme = useTheme();
  return (
    <Portal>
      <Modal visible={true}>
        <View style={styles.loaderOverlay}>
          <CustomLoader />
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
    flexShrink: 0,
  },
  content: {
    flex: 1, 
    backgroundColor: '#525659', // Cor de fundo padrão de visualizadores de PDF (Cinza escuro) fica mais bonito
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-start', // Garante que o PDF comece do topo
    alignItems: 'center',
  },
  pdfScrollContainer: {
    overflow: 'scroll', 
    width: '100%',
    height: '100%',
    alignItems: 'center', 
    paddingVertical: 20, // Espaço extra em cima e embaixo para respirar
  },
  loader: {
    marginTop: 50,
  },
  footer: {
    marginTop: 15,
    flexShrink: 0,
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Escureci um pouco mais para contraste em telas claras
    alignItems: 'center',
    justifyContent: 'center',
  },
});