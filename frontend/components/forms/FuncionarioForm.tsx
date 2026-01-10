import { ModelFuncionario } from "@/models/ModelFuncionario";
import { ModelEstabelecimento } from "@/models/ModelEstabelecimento";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { MaskedTextInput } from "react-native-mask-text";
import { TextInput, Button, Menu, HelperText, useTheme } from "react-native-paper";
import { set } from "date-fns";

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

    // Divisão dos periodos do dia para o horário contratual
    const [periodo1, setPeriodo1] = useState('');
    const [periodo2, setPeriodo2] = useState('');

    const theme = useTheme();

    const [loading, setLoading] = useState(false);

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

    // Sempre que periodo1 ou periodo2 mudar, atualizamos o formData.horarioContratual
    useEffect(() => {
        let horarioCompleto = periodo1;

        // Só adiciona o segundo período se ele tiver sido preenchido
        // (Verifica se tem pelo menos alguns números para evitar traços soltos)
        if (periodo2 && periodo2.length > 4) {
            horarioCompleto += `-${periodo2}`;
        }

        // Atualiza o estado principal sem recriar o objeto inteiro desnecessariamente
        setFormData(prev => {
            if (prev.horarioContratual === horarioCompleto) return prev;
            return { ...prev, horarioContratual: horarioCompleto };
        });

        // Limpa erro se tiver preenchido algo
        if (periodo1 && errors.horarioContratual) {
            setErrors(prev => ({ ...prev, horarioContratual: undefined }));
        }
    }, [periodo1, periodo2]);

    const verificarDadosFormulario = useCallback(() => {

        if (funcionario?.id !== null && funcionario?.id !== undefined) {
            setFormData(funcionario);

            // Preenche os períodos do horário contratual
            if (funcionario.horarioContratual) {
                const parts = funcionario.horarioContratual.split('-');

                // 1º Período: Se existir, seta. Se não, limpa.
                if (parts.length >= 2) {
                    setPeriodo1(`${parts[0]}-${parts[1]}`);
                } else {
                    setPeriodo1('');
                }

                // 2º Período: AQUI ESTÁ A CORREÇÃO IMPORTANTE
                // Se tiver 4 partes, preenche. Se tiver menos, FORÇA VAZIO.
                if (parts.length >= 4) {
                    setPeriodo2(`${parts[2]}-${parts[3]}`);
                } else {
                    setPeriodo2('');
                }
            } else {
                // Se não tiver horário nenhum definido
                setPeriodo1('');
                setPeriodo2('');
            }
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

        /* // --- VALIDAÇÃO ESTRITA (2 PERÍODOS OBRIGATÓRIOS) ---
        // Verifica se ambos têm exatamente 11 caracteres (ex: "08:00-12:00")
        const isP1Completo = periodo1.length === 11;
        const isP2Completo = periodo2.length === 11;

        if (!isP1Completo || !isP2Completo) {
            newErrors.horarioContratual = "É obrigatório preencher os dois períodos completos (Entrada/Saída 1 e 2).";
        } */

        // Validação do Horário permitindo meio período
        // Verifica se tem o tamanho correto da máscara (11 caracteres: "00:00-00:00")
        const isP1Completo = periodo1.length === 11;
        const isP2Completo = periodo2.length === 11;
        const isP2Vazio = periodo2.length === 0;

        // Regra 1: O 1º período é obrigatório se o 2º estiver vazio, 
        // ou pelo menos um dos dois deve estar 100% completo.
        if (!isP1Completo && isP2Vazio) {
            newErrors.horarioContratual = "É necessário preencher ao menos o 1º período completo.";
        }
        // Regra 2: Se o usuário começou a digitar o 1º período, ele deve terminar
        else if (periodo1.length > 0 && !isP1Completo) {
            newErrors.horarioContratual = "O 1º período está incompleto (formato HH:mm-HH:mm).";
        }
        // Regra 3: Se o usuário começou a digitar o 2º período, ele deve terminar
        else if (periodo2.length > 0 && !isP2Completo) {
            newErrors.horarioContratual = "O 2º período está incompleto (formato HH:mm-HH:mm).";
        }

        // Validação condicional da senha
        if (!formData.id && !formData.password) {
            newErrors.password = "A senha é obrigatória na criação.";
        }

        setErrors(newErrors);

        // Se não houver erros, envia o formulário
        if (Object.keys(newErrors).length === 0) {
            try {
                onSubmit(formData);
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
            catch (error) {
                return;
            }


        } else {
            return;
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HelperText type="error" visible={!!errors.nome}>
                {errors.nome}
            </HelperText>
            <TextInput
                label="Nome"
                value={formData.nome}
                onChangeText={(text) => handleChange('nome', text)}
                style={styles.input}
                error={!!errors.nome}
                editable={!isReadOnly}
            />

            <HelperText type="error" visible={!!errors.cpf}>
                {errors.cpf}
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

            <HelperText type="error" visible={!!errors.email}>
                {errors.email}
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

            {!funcionario?.id && (
                <>
                    <HelperText type="error" visible={!!errors.password}>
                        {errors.password}
                    </HelperText>
                    <TextInput
                        label="Senha"
                        value={formData.password}
                        onChangeText={(text) => handleChange('password', text)}
                        style={styles.input}
                        secureTextEntry
                        error={!!errors.password}
                    />
                </>
            )}
            <HelperText type="error" visible={!!errors.cargo}>
                {errors.cargo}
            </HelperText>
            <TextInput
                label="Cargo"
                value={formData.cargo}
                onChangeText={(text) => handleChange('cargo', text)}
                style={styles.input}
                error={!!errors.cargo}
                editable={!isReadOnly}
            />

            <HelperText type="error" visible={!!errors.role}>
                {errors.role}
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

            <View style={styles.input}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* 1º PERÍODO */}
                    <View style={{ flex: 1 }}>
                        <TextInput
                            mode="outlined"
                            label="Jornada (1º Período)"
                            placeholder={isReadOnly ? "" : "08:00-12:00"}
                            value={periodo1}
                            error={!!errors.horarioContratual}
                            // Adicionamos um ícone para dar contexto visual
                            left={<TextInput.Icon icon="clock-time-four-outline" color={theme.colors.onSurfaceVariant} />}
                            //style={{ backgroundColor: theme.colors.surface }}
                            render={props =>
                                <MaskedTextInput
                                    {...props}
                                    editable={!isReadOnly}
                                    mask="99:99-99:99"
                                    onChangeText={(text, raw) => setPeriodo1(text)}
                                />
                            }
                        />
                    </View>

                    {/* 2º PERÍODO */}
                    <View style={{ flex: 1 }}>
                        <TextInput
                            mode="outlined"
                            label="Jornada (2º Período)"
                            placeholder={isReadOnly ? "" : "13:00-18:00"}
                            value={periodo2}
                            error={!!errors.horarioContratual}
                            left={<TextInput.Icon icon="clock-time-eight-outline" color={theme.colors.onSurfaceVariant} />}
                            style={{ backgroundColor: theme.colors.surface }}
                            render={props =>
                                <MaskedTextInput
                                    {...props}
                                    editable={!isReadOnly}
                                    mask="99:99-99:99"
                                    onChangeText={(text, raw) => setPeriodo2(text)}
                                />
                            }
                        />
                    </View>
                </View>

                {/* Helper Text Unificado: Só aparece se tiver erro ou se quiser dar uma dica sutil */}
                {errors.horarioContratual ? (
                    <HelperText type="error" visible={true}>
                        {errors.horarioContratual}
                    </HelperText>
                ) : (
                    <HelperText type="info" visible={!isReadOnly} style={{ color: theme.colors.outline }}>
                        Formato: Entrada-Saída (Ex: 08:00-12:00)
                    </HelperText>
                )}
            </View>

            {!isReadOnly && (
                <Button
                    disabled={loading}
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