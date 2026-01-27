import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, useTheme, Avatar, Text } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import CustomLoader from '@/components/CustomLoader';

export default function DadosPessoaisScreen() {
    const theme = useTheme();
    const { userId } = useAuth(); // Assumindo que 'user' tem dados básicos
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Estados do formulário
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [cargo, setCargo] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');

    // Busca os dados do perfil
    const fetchPerfil = async () => {
        setLoading(true);
        try {
            // Ajuste a rota para buscar os dados completos do funcionário logado
            const response = await api.get(`/Funcionarios/id?funcionarioId=${userId}`);
            if (response.data) {
                const dados = response.data;
                setNome(dados.nome || '');
                setCpf(dados.cpf || '');
                setCargo(dados.cargo || '');
                setEmail(dados.email || ''); // E-mail geralmente vem do login ou funcionário
                setTelefone(dados.telefone || ''); // Supondo que exista esse campo
            }
        } catch (error) {
            console.error(error);
            showNotification('Erro ao carregar dados do perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (userId) fetchPerfil();
        }, [userId])
    );

    const handleSalvar = async () => {
        setSaving(true);
        try {
            // Rota hipotética para atualizar dados básicos
            await api.put(`/Funcionarios/${userId}`, {
                telefone: telefone,
                // Envie apenas o que for editável
            });
            showNotification('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            showNotification('Não foi possível atualizar os dados.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CustomLoader />;

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Avatar.Text 
                        size={80} 
                        label={nome.substring(0, 2).toUpperCase()} 
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <Text variant="headlineSmall" style={{ marginTop: 10, fontWeight: 'bold' }}>{nome}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{cargo}</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Nome Completo"
                        value={nome}
                        mode="outlined"
                        disabled // Geralmente funcionário não muda o próprio nome no sistema
                        style={styles.input}
                    />
                    
                    <TextInput
                        label="CPF"
                        value={cpf}
                        mode="outlined"
                        disabled
                        style={styles.input}
                    />

                    <TextInput
                        label="E-mail Atual"
                        value={email}
                        mode="outlined"
                        disabled
                        right={<TextInput.Icon icon="lock" />}
                        style={styles.input}
                    />

                    <TextInput
                        label="Telefone / Celular"
                        value={telefone}
                        onChangeText={setTelefone}
                        mode="outlined"
                        placeholder="(00) 00000-0000"
                        keyboardType="phone-pad"
                        disabled
                        style={styles.input}
                    />

                    <Button 
                        mode="contained" 
                        onPress={handleSalvar} 
                        loading={saving}
                        disabled={saving}
                        style={styles.button}
                    >
                        Salvar Alterações
                    </Button>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    form: {
        gap: 15,
    },
    input: {
        backgroundColor: 'transparent',
    },
    button: {
        marginTop: 10,
        paddingVertical: 6,
    }
});