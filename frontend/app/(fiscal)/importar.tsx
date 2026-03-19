import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Card, Avatar, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/services/api';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { isAxiosError } from 'axios';

export default function ImportarPlanilhaScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId } = useAuth();
    const { showNotification } = useNotification();

    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loadingEmpresa, setLoadingEmpresa] = useState(true);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [uploading, setUploading] = useState(false);

    // 1. Busca a empresa do fiscal logado
    useEffect(() => {
        const carregarEmpresaDoFiscal = async () => {
            try {
                const response = await api.get(`/funcionarios/id?funcionarioId=${userId}`);
                if (response.data?.estabelecimento?.empresaId) {
                    setEmpresaId(response.data.estabelecimento.empresaId);
                } else {
                    showNotification("Erro: Empresa não encontrada para este usuário.", "error");
                }
            } catch (error) {
                console.error("Erro ao carregar dados do fiscal:", error);
                showNotification("Erro ao carregar dados do usuário.", "error");
            } finally {
                setLoadingEmpresa(false);
            }
        };

        if (userId) carregarEmpresaDoFiscal();
    }, [userId]);

    // 2. Abre a galeria/explorador de arquivos
    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'text/csv', 
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                    'application/vnd.ms-excel' // .xls
                ],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
            }
        } catch (error) {
            console.error("Erro ao selecionar documento:", error);
        }
    };

    // 3. Envia o arquivo para a API (.NET)
    const handleUpload = async () => {
        if (!selectedFile) {
            showNotification("Por favor, selecione um arquivo primeiro.", "error");
            return;
        }

        if (!empresaId) {
            showNotification("Erro de identificação da empresa.", "error");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            
            // TRATATIVA DIFERENTE PARA WEB E MOBILE
            if (Platform.OS === 'web') {
                // Na Web, o expo-document-picker traz o arquivo real dentro da propriedade 'file'
                if (selectedFile.file) {
                    formData.append('arquivo', selectedFile.file);
                } else {
                    // Fallback seguro caso o navegador se comporte de forma estranha
                    const res = await fetch(selectedFile.uri);
                    const blob = await res.blob();
                    formData.append('arquivo', blob, selectedFile.name);
                }
            } else {
                // No Android e iOS, mantemos o padrão do React Native
                formData.append('arquivo', {
                    uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
                    name: selectedFile.name,
                    type: selectedFile.mimeType || 'application/octet-stream',
                } as any);
            }

            // Adiciona o ID da empresa
            formData.append('empresaId', empresaId);

            const response = await api.post('api/Eventos/importar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showNotification(`Sucesso! ${response.data.insercoes} inscrições processadas.`, "success");
            
            setSelectedFile(null);
            router.back(); 

        } catch (error) {
            console.error("Erro no upload:", error);
            if (isAxiosError(error) && error.response) {
                const apiMessage = typeof error.response.data === 'string' 
                    ? error.response.data 
                    : error.response.data?.erro || "Erro desconhecido da API";
                showNotification(apiMessage, "error");
            } else {
                showNotification("Erro na conexão com o servidor.", "error");
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton icon="arrow-left" onPress={() => router.back()} />
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                        Importar Prova
                    </Text>
                </View>
            </View>

            <ScreenContainer>
                {loadingEmpresa ? (
                    <ActivityIndicator style={{ marginTop: 50 }} size="large" />
                ) : (
                    <View style={styles.content}>
                        <Text variant="bodyLarge" style={{ marginBottom: 20, color: theme.colors.onSurfaceVariant }}>
                            Selecione a planilha da instituição (Excel ou CSV) contendo os dados dos alunos e locais de prova. O sistema irá extrair as informações e criar o evento automaticamente.
                        </Text>

                        {/* Botão de Selecionar Arquivo */}
                        <Button 
                            mode="outlined" 
                            icon="file-search-outline" 
                            onPress={handlePickDocument}
                            style={styles.pickButton}
                            disabled={uploading}
                        >
                            Escolher Planilha
                        </Button>

                        {/* Card mostrando o arquivo selecionado */}
                        {selectedFile && (
                            <Card style={styles.fileCard} mode="contained">
                                <Card.Content style={styles.fileCardContent}>
                                    <Avatar.Icon size={40} icon="file-excel" style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                                    <View style={styles.fileInfo}>
                                        <Text variant="titleMedium" numberOfLines={1} style={{ fontWeight: 'bold' }}>
                                            {selectedFile.name}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                            {(selectedFile.size ?? 0) > 1024 * 1024 
                                                ? `${((selectedFile.size ?? 0) / (1024 * 1024)).toFixed(2)} MB` 
                                                : `${((selectedFile.size ?? 0) / 1024).toFixed(2)} KB`}
                                        </Text>
                                    </View>
                                    <IconButton 
                                        icon="close-circle" 
                                        iconColor={theme.colors.error} 
                                        size={24} 
                                        onPress={() => setSelectedFile(null)}
                                        disabled={uploading}
                                    />
                                </Card.Content>
                            </Card>
                        )}

                        {/* Botão de Enviar */}
                        <Button 
                            mode="contained" 
                            icon="cloud-upload" 
                            onPress={handleUpload}
                            loading={uploading}
                            disabled={!selectedFile || uploading}
                            style={styles.uploadButton}
                            contentStyle={{ paddingVertical: 8 }}
                        >
                            Processar Importação
                        </Button>
                    </View>
                )}
            </ScreenContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { padding: 16, paddingBottom: 8, backgroundColor: 'transparent' },
    content: { padding: 8 },
    pickButton: {
        borderStyle: 'dashed',
        borderWidth: 1,
        paddingVertical: 20,
        marginBottom: 20,
    },
    fileCard: {
        marginBottom: 24,
    },
    fileCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    uploadButton: {
        marginTop: 'auto',
    }
});