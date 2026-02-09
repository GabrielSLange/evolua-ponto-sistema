import React, { useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme } from 'react-native-paper';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import api from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AlterarSenhaScreen() {
    const { userId, role } = useAuth();
    const [permissao, setPermissao] = useState('');
    const theme = useTheme();
    const router = useRouter();
    const { showNotification } = useNotification();

    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const senhasConferem = novaSenha === confirmarSenha;
    const senhaCurta = novaSenha.length > 0 && novaSenha.length < 6;

    useFocusEffect(
        useCallback(() => {
            if (role === 'admin') setPermissao('admin');
            else setPermissao('employee');
        }, [userId])
    );

    const handleChangePassword = async () => {
        if (!senhasConferem) {
            showNotification('As novas senhas não conferem.', 'error');
            return;
        }
        if (novaSenha.length < 6) {
            showNotification('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Endpoint de troca de senha (Auth Controller)
            await api.post('/Auth/change-password', {
                userId: userId,
                currentPassword: senhaAtual,
                newPassword: novaSenha
            });
            
            showNotification('Senha alterada com sucesso!', 'success');
            router.back(); // Volta para a tela anterior
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro ao alterar senha. Verifique sua senha atual.';
            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        Alterar Senha
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Crie uma senha forte para proteger sua conta.
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Senha Atual"
                        value={senhaAtual}
                        onChangeText={setSenhaAtual}
                        mode="outlined"
                        secureTextEntry={secureTextEntry}
                        right={<TextInput.Icon icon="eye" onPress={() => setSecureTextEntry(!secureTextEntry)} />}
                    />

                    <TextInput
                        label="Nova Senha"
                        value={novaSenha}
                        onChangeText={setNovaSenha}
                        mode="outlined"
                        secureTextEntry={secureTextEntry}
                        error={senhaCurta}
                    />
                    {senhaCurta && <HelperText type="error">Mínimo de 6 caracteres.</HelperText>}

                    <TextInput
                        label="Confirmar Nova Senha"
                        value={confirmarSenha}
                        onChangeText={setConfirmarSenha}
                        mode="outlined"
                        secureTextEntry={secureTextEntry}
                        error={!senhasConferem && confirmarSenha.length > 0}
                    />
                    {!senhasConferem && confirmarSenha.length > 0 && (
                        <HelperText type="error">As senhas não coincidem.</HelperText>
                    )}

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Button 
                        mode="outlined" 
                        onPress={() => router.push({
                                pathname: `/(${permissao})/meu-ponto/home`,
                            })}
                        style={styles.button}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        mode="contained" 
                        onPress={handleChangePassword} 
                        loading={loading}
                        disabled={loading || !senhaAtual || !novaSenha || !senhasConferem}
                        style={styles.button}
                    >
                        Atualizar Senha
                    </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 30,
    },
    form: {
        gap: 15,
    },
    button: {
        marginTop: 10,
        paddingVertical: 6,
        flex: 1,
    }
});