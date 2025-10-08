import { ModelFuncionario } from "@/models/ModelFuncionario";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { TextInput, Button } from "react-native-paper";

// Props que o formulário recebe
interface FuncionarioFormProps {
    funcionario?: ModelFuncionario;
    onSubmit: (data: ModelFuncionario) => void;
    submitButtonLabel?: string;
}

const FuncionarioForm: React.FC<FuncionarioFormProps> = ({
    funcionario,
    onSubmit,
    submitButtonLabel = 'Salvar',
}) => {
    const [formData, setFormData] = useState<ModelFuncionario>({
        id: null,
        estabelecimentoId: '',
        nome: '',
        cpf: '',
        email: '',
        password: '',
        cargo: '',
        role: '',
        ativo: true,
    });

    const verificarDadosFormulario = useCallback(() => {

        if (funcionario?.id !== null && funcionario?.id !== undefined) {
            setFormData(funcionario);
        } else {
            // Limpa o formulário no modo de criação
            setFormData({
                id: '',
                estabelecimentoId: '',
                nome: '',
                cpf: '',
                email: '',
                password: '',
                cargo: '',
                role: '',
                ativo: true,
            });
        }
    }, [funcionario]);

    useFocusEffect(verificarDadosFormulario);

    const handleChange = (name: keyof ModelFuncionario, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        // Validação simples: Verifica se os campos obrigatórios estão preenchidos
        if (!formData.nome || !formData.cpf || !formData.email || !formData.cargo || !formData.role) {
            // Exibe uma mensagem de erro ou realiza alguma ação
            console.log("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Se a validação passar, chama a função onSubmit com os dados do formulário
        onSubmit(formData);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TextInput
                label="Nome"
                value={formData.nome}
                onChangeText={(text) => handleChange('nome', text)}
                style={styles.input}
            />
            <TextInput
                label="CPF"
                value={formData.cpf}
                onChangeText={(text) => handleChange('cpf', text)}
                style={styles.input}
            />
            <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                style={styles.input}
            />
            {!funcionario?.id && (
                <TextInput
                    label="Senha"
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    style={styles.input}
                />
            )}
            <TextInput
                label="Senha"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                style={styles.input}
            />
            <TextInput
                label="Cargo"
                value={formData.cargo}
                onChangeText={(text) => handleChange('cargo', text)}
                style={styles.input}
            />
            <TextInput
                label="Permissão"
                value={formData.role}
                onChangeText={(text) => handleChange('role', text)}
                style={styles.input}
            />
            <Button
                mode="contained"
                onPress={handleSubmit}
            >
                {submitButtonLabel}
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
    },
});

export default FuncionarioForm;