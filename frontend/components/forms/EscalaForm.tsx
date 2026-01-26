import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, useTheme, Checkbox, Divider, IconButton, HelperText } from 'react-native-paper';
import { Escala, EscalaDiaDto, EscalaFormSchema } from '@/hooks/admin/useEscala';
import { ThemeContext } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';

interface Props {
    initialData?: Escala;
    onSubmit: (data: EscalaFormSchema) => void;
    loading: boolean;
    onCancel: () => void;
    isEdit?: boolean;
}

// Define a estrutura do objeto de erros (Seguindo padrão do FuncionarioForm)
type FormErrors = {
    nome?: string;
    cargaHoraria?: string;
    dias?: string; // Erro genérico para a tabela
};

// Nomes dos dias para exibição
const DIA_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Ordem de exibição (Segunda primeiro)
const DIA_ORDER = [1, 2, 3, 4, 5, 6, 0];

const EscalaForm: React.FC<Props> = ({
    initialData,
    onSubmit,
    loading,
    onCancel,
    isEdit = false }) => {

    const theme = useTheme();

    // Estados
    const [nome, setNome] = useState('');
    const [cargaHoraria, setCargaHoraria] = useState('');

    // Inicializa os 7 dias vazios ou com dados
    const [dias, setDias] = useState<EscalaDiaDto[]>([]);

    // Estados de Erro
    const [errors, setErrors] = useState<FormErrors>({});
    const [diasComErro, setDiasComErro] = useState<number[]>([]); // Lista de dias com erro

    const verificarDadosFormulario = useCallback(() => {
        if (initialData) {
            setNome(initialData.nome);
            setCargaHoraria(String(initialData.cargaHorariaSemanal));
            // Garante que o array tenha os 7 dias preenchidos (merge com default)
            setDias(preencherDiasFaltantes(initialData.dias));
        } else {
            setNome('');
            setCargaHoraria('');
            // Novo: Cria 7 dias zerados
            setDias(preencherDiasFaltantes([]));
        }
        setErrors({});
        setDiasComErro([]); // Limpa os erros
    }, [initialData])

    useFocusEffect(verificarDadosFormulario);

    const preencherDiasFaltantes = (existentes: EscalaDiaDto[]) => {
        const completo: EscalaDiaDto[] = [];
        for (let i = 0; i <= 6; i++) {
            const found = existentes.find(d => d.diaSemana === i);
            if (found) {
                // Remove os segundos se vierem do backend "08:00:00" -> "08:00"
                completo.push({
                    ...found,
                    entrada: formatTime(found.entrada),
                    saidaIntervalo: formatTime(found.saidaIntervalo),
                    voltaIntervalo: formatTime(found.voltaIntervalo),
                    saida: formatTime(found.saida),
                });
            } else {
                completo.push({
                    diaSemana: i,
                    isFolga: i === 0 || i === 6, // Sáb e Dom folga por padrão
                    entrada: '', saidaIntervalo: '', voltaIntervalo: '', saida: ''
                });
            }
        }
        return completo;
    };

    const formatTime = (t?: string) => t ? t.substring(0, 5) : '';

    const handleDiaChange = (diaSemana: number, field: keyof EscalaDiaDto, value: any) => {
        setDiasComErro(prev => {
            if (prev.includes(diaSemana)) {
                return prev.filter(d => d !== diaSemana);
            }
            return prev;
        });

        setDias(prev => prev.map(d => {
            if (d.diaSemana !== diaSemana) return d;

            // Lógica nova: Se marcou "Folga" (value === true), limpa os horários
            if (field === 'isFolga' && value === true) {
                return {
                    ...d,
                    [field]: value, // Define isFolga = true
                    entrada: '',
                    saidaIntervalo: '',
                    voltaIntervalo: '',
                    saida: ''
                };
            }

            // Comportamento padrão para outros campos
            return { ...d, [field]: value };
        }));
    };

    // Copia os horários de Segunda (1) para Terça(2) até Sexta(5)
    const replicarSegunda = () => {
        const seg = dias.find(d => d.diaSemana === 1);
        if (!seg) return;

        setDias(prev => prev.map(d => {
            if (d.diaSemana >= 2 && d.diaSemana <= 5) {
                return {
                    ...d,
                    isFolga: seg.isFolga,
                    entrada: seg.entrada,
                    saidaIntervalo: seg.saidaIntervalo,
                    voltaIntervalo: seg.voltaIntervalo,
                    saida: seg.saida
                };
            }
            return d;
        }));
        setDiasComErro([]); // Limpa os erros
    };

    // Função auxiliar para formatar HH:mm -> HH:mm:ss ou retornar null
    const formatForApi = (time?: string) => {
        if (!time || time.trim() === '') return undefined; // Envia null se vazio
        if (time.length === 5) return `${time}:00`; // Transforma "08:00" em "08:00:00"
        return time;
    };

    const handleSubmit = () => {
        const newErrors: FormErrors = {};
        const newDiasComErro: number[] = [];

        // Validações básicas
        if (!nome) newErrors.nome = "O nome é obrigatório.";
        if (!cargaHoraria || Number(cargaHoraria) <= 0) newErrors.cargaHoraria = "Informe uma carga horária válida.";

        // Formata os dias garantindo que horas vazias sejam null e horas preenchidas tenham segundos
        const diasFormatados = dias.map(d => ({
            ...d,
            entrada: formatForApi(d.entrada),
            saidaIntervalo: formatForApi(d.saidaIntervalo),
            voltaIntervalo: formatForApi(d.voltaIntervalo),
            saida: formatForApi(d.saida)
        }));

        // Validação dos Dias
        diasFormatados.forEach(dia => {
            if (!dia.isFolga) {
                const temEntrada = !!dia.entrada;
                const temSaida = !!dia.saida;
                const temSaidaInt = !!dia.saidaIntervalo;
                const temVoltaInt = !!dia.voltaIntervalo;

                // Cenário 1: Turno único (Entrada e saída)
                const isTurnoUnico = temEntrada && temSaida && !temSaidaInt && !temVoltaInt;

                // Cenário 2: Turno Completo (Os 4 horários)
                const isTurnoCompleto = temEntrada && temSaida && temSaidaInt && temVoltaInt;

                if (!isTurnoUnico && !isTurnoCompleto) {
                    newDiasComErro.push(dia.diaSemana);
                }
            }
        });

        if (newDiasComErro.length > 0) {
            newErrors.dias = "Existem dias com horários inconsistentes.";
        }

        setErrors(newErrors);
        setDiasComErro(newDiasComErro);

        if (Object.keys(newErrors).length === 0 && newDiasComErro.length === 0) {
            onSubmit({
                nome,
                cargaHorariaSemanal: cargaHoraria,
                dias: diasFormatados
            });
        }
    };

    // Componente de Linha (Renderizado dentro do loop)
    const renderDiaRow = (diaIndex: number) => {
        const dia = dias.find(d => d.diaSemana === diaIndex);
        if (!dia) return null;

        const isInvalid = diasComErro.includes(diaIndex);

        return (
            <View key={diaIndex} style={[
                styles.diaRow,
                isInvalid && styles.diaRowError
            ]}>
                <View style={styles.diaHeader}>
                    <Text style={{ fontWeight: 'bold', width: 80, color: isInvalid ? theme.colors.error : theme.colors.onSurface }}>{DIA_NAMES[diaIndex]}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox
                            status={dia.isFolga ? 'checked' : 'unchecked'}
                            onPress={() => !isEdit && handleDiaChange(diaIndex, 'isFolga', !dia.isFolga)}
                            disabled={isEdit}
                            color={isInvalid ? theme.colors.error : undefined}
                        />
                        <Text
                            onPress={() => !isEdit && handleDiaChange(diaIndex, 'isFolga', !dia.isFolga)}
                            style={{ color: isEdit ? theme.colors.outline : (isInvalid ? theme.colors.error : theme.colors.onSurface) }}
                        >
                            Folga</Text>
                    </View>
                </View>

                {!dia.isFolga && (
                    <View style={styles.timeInputsRow}>
                        <TimeInput
                            label="Entrada"
                            value={dia.entrada}
                            onChange={v => handleDiaChange(diaIndex, 'entrada', v)}
                            disabled={isEdit}
                            error={isInvalid}
                        />
                        <TimeInput
                            label="Saída Int."
                            value={dia.saidaIntervalo}
                            onChange={v => handleDiaChange(diaIndex, 'saidaIntervalo', v)}
                            disabled={isEdit}
                            error={isInvalid}
                        />
                        <TimeInput
                            label="Volta Int."
                            value={dia.voltaIntervalo}
                            onChange={v => handleDiaChange(diaIndex, 'voltaIntervalo', v)}
                            disabled={isEdit}
                            error={isInvalid}
                        />
                        <TimeInput
                            label="Saída"
                            value={dia.saida}
                            onChange={v => handleDiaChange(diaIndex, 'saida', v)}
                            disabled={isEdit}
                            error={isInvalid}
                        />
                    </View>
                )}
                <Divider style={{ marginTop: 12 }} />
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
            {isEdit && (
                <View style={{ marginBottom: 16, backgroundColor: theme.colors.secondaryContainer, padding: 10, borderRadius: 8 }}>
                    <Text variant='bodySmall' style={{ color: theme.colors.onSecondaryContainer }}>
                        Nota: Apenas o nome da escala pode ser alterado.
                    </Text>
                </View>
            )}

            {errors.nome && <HelperText type="error" visible={true}>{errors.nome}</HelperText>}
            <TextInput
                mode="outlined"
                label="Nome da Escala (Ex: Comercial)"
                value={nome}
                onChangeText={(t) => {
                    setNome(t);
                    if (errors.nome) setErrors(prev => ({ ...prev, nome: undefined }));
                }}
                style={styles.input}
                error={!!errors.nome}
            />

            {errors.cargaHoraria && <HelperText type="error" visible={true}>{errors.cargaHoraria}</HelperText>}
            <TextInput
                mode="outlined"
                label="Carga Horária Semanal (Ex: 44)"
                value={cargaHoraria}
                onChangeText={(t) => {
                    setCargaHoraria(t);
                    if (errors.cargaHoraria) setErrors(prev => ({ ...prev, cargaHoraria: undefined }));
                }}
                keyboardType="numeric"
                style={styles.input}
                disabled={isEdit}
                error={!!errors.cargaHoraria}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Horários</Text>
                {!isEdit && (
                    <Button mode="text" compact onPress={replicarSegunda}>Copiar Seg p/ Sex</Button>
                )}
            </View>

            {errors.dias && (
                <View style={{ backgroundColor: theme.colors.errorContainer, padding: 8, borderRadius: 4, marginBottom: 10 }}>
                    <Text style={{ color: theme.colors.onErrorContainer }}>{errors.dias}</Text>
                </View>
            )}

            <View style={styles.tabelaContainer}>
                {DIA_ORDER.map(diaIndex => renderDiaRow(diaIndex))}
            </View>

            <View style={styles.actions}>
                <Button mode="outlined" onPress={onCancel} style={{ flex: 1 }}>Cancelar</Button>
                <Button mode="contained" onPress={handleSubmit} loading={loading} style={{ flex: 1 }}>
                    Salvar
                </Button>
            </View>
        </ScrollView>
    );
}

// Componente Pequeno para Input de Hora
const TimeInput = ({ label, value, onChange, disabled, error }: { label: string, value?: string, onChange: (t: string) => void, disabled?: boolean, error?: boolean }) => {
    // Máscara simples de hora (pode melhorar com biblioteca de mask)
    const handleChange = (text: string) => {
        // Lógica simples para adicionar : automaticamente
        let cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length > 4) cleaned = cleaned.substring(0, 4);

        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = `${cleaned.substring(0, 2)}:${cleaned.substring(2)}`;
        }
        onChange(formatted);
    };

    return (
        <View style={{ flex: 1, marginHorizontal: 2 }}>
            <Text variant="labelSmall" style={{ textAlign: 'center', marginBottom: 2 }}>{label}</Text>
            <TextInput
                mode="outlined"
                value={value}
                onChangeText={handleChange}
                placeholder="00:00"
                keyboardType="numeric"
                maxLength={5}
                dense
                style={{ textAlign: 'center', fontSize: 12, height: 40 }}
                contentStyle={{ paddingVertical: 0 }}
                disabled={disabled}
                editable={!disabled}
                error={error}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    input: {
        marginBottom: 12
    },
    tabelaContainer: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 16
    },
    diaRow: {
        marginBottom: 8
    },
    diaRowError: {
        borderWidth: 1,
        borderColor: '#ef5350'
    }, // Estilo para linha com erro
    diaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    timeInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10
    }
});

export default EscalaForm;