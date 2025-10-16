import { ModelFuncionario } from "@/models/ModelFuncionario";
import { ModelEstabelecimento } from "@/models/ModelEstabelecimento";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import { TextInput, Button, Menu, HelperText } from "react-native-paper";
import { Fieldset } from "../layouts/FieldSet";

// Props que o formulário recebe
interface FuncionarioFormProps {
    funcionario?: ModelFuncionario;
    onSubmit: (data: ModelFuncionario) => void;
    submitButtonLabel?: string;
    estabelecimentos?: ModelEstabelecimento[]; // Lista de estabelecimentos para o dropdown
    isReadOnly?: boolean;
}

// Define a estrutura do objeto de erros
type FormErrors = Partial<Record<keyof ModelFuncionario, string>>;

const FuncionarioForm: React.FC<FuncionarioFormProps> = ({
    funcionario,
    onSubmit,
    submitButtonLabel = 'Salvar',
    estabelecimentos = [],
    isReadOnly = false,
}) => {
    // Opções para o dropdown de permissões
    const roleOptions = [
        { label: 'Administrador', value: 'admin' },
        { label: 'Funcionário', value: 'normal' },
    ];

    // Estado para co dropdown de permissões
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
        horarioContratual: '',
        role: '',
        ativo: true,
    });

    // 1. Estado para armazenar as mensagens de erro
    const [errors, setErrors] = useState<FormErrors>({});

    const verificarDadosFormulario = useCallback(() => {

        if (funcionario?.id !== null && funcionario?.id !== undefined) {
            setFormData(funcionario);
        } else {
            // Limpa o formulário no modo de criação
            setFormData({
                id: null,
                estabelecimentoId: '',
                nome: '',
                cpf: '',
                email: '',
                password: '',
                cargo: '',
                horarioContratual: '',
                role: '',
                ativo: true,
            });
        }
        // Limpa os erros ao carregar o formulário
        setErrors({});
    }, [funcionario]);

    useFocusEffect(verificarDadosFormulario);

    const handleChange = (name: keyof ModelFuncionario, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpa o erro do campo específico quando o usuário começa a digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = () => {
        // 2. Lógica de validação para construir o objeto de erros
        const newErrors: FormErrors = {};

        if (!formData.nome) newErrors.nome = "O nome é obrigatório.";
        if (!formData.cpf) newErrors.cpf = "O CPF é obrigatório.";
        if (!formData.email) newErrors.email = "O e-mail é obrigatório.";
        if (!formData.cargo) newErrors.cargo = "O cargo é obrigatório.";
        if (!formData.role) newErrors.role = "A permissão é obrigatória.";
        if (!formData.horarioContratual) newErrors.horarioContratual = "O horário contratual é obrigatório.";

        // Validação condicional da senha
        if (!formData.id && !formData.password) {
            newErrors.password = "A senha é obrigatória na criação.";
        }

        setErrors(newErrors);

        // Se não houver erros, envia o formulário
        if (Object.keys(newErrors).length === 0) {
            onSubmit(formData);
        } else {
            return;
        }
    };

    return (

        <ScrollView contentContainerStyle={styles.container}>
            {/* 3. Conecta o estado de erro aos componentes de input */}
            <TextInput
                label="Nome"
                value={formData.nome}
                onChangeText={(text) => handleChange('nome', text)}
                style={styles.input}
                error={!!errors.nome}
                editable={!isReadOnly}
            />
            <HelperText type="error" visible={!!errors.nome}>
                {errors.nome}
            </HelperText>

            <TextInput
                label="CPF"
                value={formData.cpf}
                keyboardType="number-pad"
                style={styles.input}
                render={props =>
                    <MaskedTextInput
                        {...props}
                        editable={!isReadOnly}
                        mask="999.999.999-99"
                        onChangeText={(text) => {
                            handleChange('cpf', text);
                        }}
                    />
                }
                error={!!errors.cpf}
            />
            <HelperText type="error" visible={!!errors.cpf}>
                {errors.cpf}
            </HelperText>

            <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                editable={!isReadOnly}
            />
            <HelperText type="error" visible={!!errors.email}>
                {errors.email}
            </HelperText>

            {!funcionario?.id && (
                <>
                    <TextInput
                        label="Senha"
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                        style={styles.input}
                        secureTextEntry
                        error={!!errors.password}
                    />
                    <HelperText type="error" visible={!!errors.password}>
                        {errors.password}
                    </HelperText>
                </>
            )}
            <TextInput
                label="Cargo"
                value={formData.cargo}
                onChangeText={(text) => handleChange('cargo', text)}
                style={styles.input}
                error={!!errors.cargo}
                editable={!isReadOnly}
            />
            <HelperText type="error" visible={!!errors.cargo}>
                {errors.cargo}
            </HelperText>

            <TextInput
                label="Horário Contratual"
                value={formData.horarioContratual}
                keyboardType="number-pad"
                style={styles.input}
                render={props =>
                    <MaskedTextInput
                        {...props}
                        editable={!isReadOnly}
                        mask="99:99 - 99:99"
                        onChangeText={(text) => {
                            handleChange('horarioContratual', text);
                        }}
                    />
                }
                editable={!isReadOnly}
            />
            <HelperText type="error" visible={!!errors.horarioContratual}>
                {errors.horarioContratual}
            </HelperText>

            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                    <TouchableOpacity onPress={openMenu} disabled={isReadOnly}>
                        <TextInput
                            label="Permissão"
                            value={roleOptions.find(opt => opt.value === formData.role)?.label || ''}
                            style={styles.input}
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" />}
                            error={!!errors.role}
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
            <HelperText type="error" visible={!!errors.role}>
                {errors.role}
            </HelperText>

            {/* Campo de Estabelecimento - Visível apenas na edição */}
            {funcionario?.id && (
                <Menu
                    visible={estabelecimentoMenuVisible}
                    onDismiss={closeEstabelecimentoMenu}
                    anchor={
                        <TouchableOpacity onPress={openEstabelecimentoMenu} disabled={isReadOnly}>
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

            {!isReadOnly && (
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                >
                    {submitButtonLabel}
                </Button>
            )}
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