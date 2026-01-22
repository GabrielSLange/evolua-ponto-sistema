import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, useTheme, Checkbox, Divider, IconButton } from 'react-native-paper';
import { Escala, EscalaDiaDto, EscalaFormSchema } from '@/hooks/admin/useEscala';
import { ThemeContext } from '@react-navigation/native';

interface Props {
    initialData?: Escala;
    onSubmit: (data: EscalaFormSchema) => void;
    loading: boolean;
    onCancel: () => void;
    isEdit?: boolean;
}

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

    useEffect(() => {
        if (initialData) {
            setNome(initialData.nome);
            setCargaHoraria(String(initialData.cargaHorariaSemanal));
            // Garante que o array tenha os 7 dias preenchidos (merge com default)
            setDias(preencherDiasFaltantes(initialData.dias));
        } else {
            // Novo: Cria 7 dias zerados
            setDias(preencherDiasFaltantes([]));
        }
    }, [initialData]);

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
    };

    // Função auxiliar para formatar HH:mm -> HH:mm:ss ou retornar null
    const formatForApi = (time?: string) => {
        if (!time || time.trim() === '') return undefined; // Envia null se vazio
        if (time.length === 5) return `${time}:00`; // Transforma "08:00" em "08:00:00"
        return time;
    };

    const handleSubmit = () => {
        // Formata os dias garantindo que horas vazias sejam null e horas preenchidas tenham segundos
        const diasFormatados = dias.map(d => ({
            ...d,
            entrada: formatForApi(d.entrada),
            saidaIntervalo: formatForApi(d.saidaIntervalo),
            voltaIntervalo: formatForApi(d.voltaIntervalo),
            saida: formatForApi(d.saida)
        }));

        onSubmit({
            nome,
            cargaHorariaSemanal: cargaHoraria,
            dias: diasFormatados
        });
    };

    // Componente de Linha (Renderizado dentro do loop)
    const renderDiaRow = (diaIndex: number) => {
        const dia = dias.find(d => d.diaSemana === diaIndex);
        if (!dia) return null;

        return (
            <View key={diaIndex} style={styles.diaRow}>
                <View style={styles.diaHeader}>
                    <Text style={{ fontWeight: 'bold', width: 80 }}>{DIA_NAMES[diaIndex]}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Checkbox
                            status={dia.isFolga ? 'checked' : 'unchecked'}
                            onPress={() => !isEdit && handleDiaChange(diaIndex, 'isFolga', !dia.isFolga)}
                            disabled={isEdit}
                        />
                        <Text 
                            onPress={() => !isEdit && handleDiaChange(diaIndex, 'isFolga', !dia.isFolga)}
                            style={{ color: isEdit ? theme.colors.outline : theme.colors.onSurface }}
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
                        />
                        <TimeInput
                            label="Saída Int."
                            value={dia.saidaIntervalo}
                            onChange={v => handleDiaChange(diaIndex, 'saidaIntervalo', v)}
                            disabled={isEdit}
                        />
                        <TimeInput
                            label="Volta Int."
                            value={dia.voltaIntervalo}
                            onChange={v => handleDiaChange(diaIndex, 'voltaIntervalo', v)}
                            disabled={isEdit}
                        />
                        <TimeInput
                            label="Saída"
                            value={dia.saida}
                            onChange={v => handleDiaChange(diaIndex, 'saida', v)}
                            disabled={isEdit}
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
                <View style={{marginBottom: 16, backgroundColor: theme.colors.secondaryContainer, padding: 10, borderRadius: 8}}>
                    <Text variant='bodySmall' style={{color: theme.colors.onSecondaryContainer}}>
                        Nota: Apenas o nome da escala pode ser alterado para garantir a integridade dos registros de ponto.
                    </Text>
                </View>
            )}

            <TextInput
                mode="outlined"
                label="Nome da Escala (Ex: Comercial)"
                value={nome}
                onChangeText={setNome}
                style={styles.input}
            />

            <TextInput
                mode="outlined"
                label="Carga Horária Semanal (Ex: 44)"
                value={cargaHoraria}
                onChangeText={setCargaHoraria}
                keyboardType="numeric"
                style={styles.input}
                disabled={isEdit}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Horários</Text>
                {!isEdit && (
                    <Button mode="text" compact onPress={replicarSegunda}>Copiar Seg p/ Sex</Button>
                )}    
            </View>

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
const TimeInput = ({ label, value, onChange, disabled }: { label: string, value?: string, onChange: (t: string) => void, disabled?: boolean }) => {
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