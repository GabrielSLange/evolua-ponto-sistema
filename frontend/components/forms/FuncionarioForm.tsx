import { ModelFuncionario } from "@/models/ModelFuncionario";
import { ModelEstabelecimento } from "@/models/ModelEstabelecimento";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import { TextInput, Button, Menu } from "react-native-paper";
import { TouchableOpacity } from "react-native-gesture-handler";

// Props que o formulário recebe
interface FuncionarioFormProps {
    funcionario?: ModelFuncionario;
    onSubmit: (data: ModelFuncionario) => void;
    submitButtonLabel?: string;
    estabelecimentos?: ModelEstabelecimento[]; // Lista de estabelecimentos para o dropdown
}

const FuncionarioForm: React.FC<FuncionarioFormProps> = ({
    funcionario,
    onSubmit,
    submitButtonLabel = 'Salvar',
    estabelecimentos = [],
}) => {
    // Opções para o dropdown de permissões
    const roleOptions = [
        { label: 'Administrador', value: 'admin' },
        { label: 'Funcionário', value: 'employee' },
    ];

    // Estado para controlar a visibilidade do dropdown
    const [menuVisible, setMenuVisible] = useState(false);
    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    // Estado para o dropdown de estabelecimentos
    const [estabelecimentoMenuVisible, setEstabelecimentoMenuVisible] = useState(false);
    const openEstabelecimentoMenu = () => setEstabelecimentoMenuVisible(true);
    const closeEstabelecimentoMenu = () => setEstabelecimentoMenuVisible(false);

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
                keyboardType="number-pad"
                style={styles.input}
                render={props =>
                    <MaskedTextInput
                        {...props}
                        mask="999.999.999-99"
                        onChangeText={(text) => {
                            handleChange('cpf', text);
                        }}
                    />
                }
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
                label="Cargo"
                value={formData.cargo}
                onChangeText={(text) => handleChange('cargo', text)}
                style={styles.input}
            />
            {/* Campo de Estabelecimento - Visível apenas na edição */}
            {funcionario?.id && (
                <Menu
                    visible={estabelecimentoMenuVisible}
                    onDismiss={closeEstabelecimentoMenu}
                    anchor={
                        <TouchableOpacity onPress={openEstabelecimentoMenu}>
                            <TextInput
                                label="Estabelecimento"
                                value={estabelecimentos.find(e => e.id === formData.estabelecimentoId)?.nomeFantasia || ''}
                                style={styles.input}
                                editable={false}
                                right={<TextInput.Icon icon="menu-down" />}
                            />
                        </TouchableOpacity>
                    }>
                    {estabelecimentos.map((est) => (
                        <Menu.Item
                            key={est.id}
                            onPress={() => {
                                handleChange('estabelecimentoId', est.id as string);
                                closeEstabelecimentoMenu();
                            }}
                            title={est.nomeFantasia}
                        />
                    ))}
                </Menu>
            )}
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                    <TouchableOpacity onPress={openMenu}>
                        <TextInput
                            label="Permissão"
                            value={roleOptions.find(opt => opt.value === formData.role)?.label || ''}
                            style={styles.input}
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" />}
                        />
                    </TouchableOpacity>
                }>
                {roleOptions.map((option) => (
                    <Menu.Item
                        key={option.value}
                        onPress={() => {
                            handleChange('role', option.value);
                            closeMenu();
                        }}
                        title={option.label}
                    />
                ))}
            </Menu>
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