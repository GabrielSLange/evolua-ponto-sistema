import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import api from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function AlterarEmailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { userId, signOut } = useAuth(); // Talvez seja necessário deslogar ao trocar email
    const { showNotification } = useNotification();

    const [novoEmail, setNovoEmail] = useState('');
    const [senha, setSenha] = useState(''); // Confirmação de segurança
    const [loading, setLoading] = useState(false);

    const handleChangeEmail = async () => {
        if (!novoEmail.includes('@') || !novoEmail.includes('.')) {
            showNotification('Insira um e-mail válido.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Endpoint hipotético
            await api.post('/Auth/change-email', {
                userId: userId,
                newEmail: novoEmail,
                password: senha // Envia a senha para validar a operação no backend
            });
            
            showNotification('E-mail atualizado! Por favor, faça login novamente.', 'success');
            
            // É boa prática deslogar o usuário quando o e-mail (login) muda
            setTimeout(() => {
                signOut();
            }, 2000);

        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro ao alterar e-mail. Verifique sua senha.';
            showNotification(msg, 'error');
            setLoading(false);
        }
    };

    return (
        <ScreenContainer>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
                
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        Alterar E-mail
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Atualize seu endereço de contato. Você precisará confirmar sua senha atual.
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Novo E-mail"
                        value={novoEmail}
                        onChangeText={setNovoEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="email-outline" />}
                    />

                    <TextInput
                        label="Confirme sua Senha Atual"
                        value={senha}
                        onChangeText={setSenha}
                        mode="outlined"
                        secureTextEntry
                        placeholder="Para sua segurança"
                        left={<TextInput.Icon icon="lock-outline" />}
                    />

                    <Button 
                        mode="contained" 
                        onPress={handleChangeEmail} 
                        loading={loading}
                        disabled={loading || !novoEmail || !senha}
                        style={styles.button}
                    >
                        Salvar Novo E-mail
                    </Button>
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
    }
});