import React, { use, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { TextInput, Button, Text, useTheme, Menu } from 'react-native-paper';
import { SearchableDropdown } from '@/components/layouts/SearchableDropdown';
import { DropdownItem, FeriadoFormSchema } from '@/hooks/admin/useFeriado';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { set } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';

interface Props {
    estabelecimentosOpcoes: DropdownItem[];
    onSubmit: (data: FeriadoFormSchema) => void;
    loading: boolean;
    onCancel: () => void;
}

export default function FeriadoForm({ estabelecimentosOpcoes, onSubmit, loading, onCancel }: Props) {
    const router = useRouter();
    const theme = useTheme();

    // Estado para dropdown de estabelecimento
    const [estabelecimentoMenuVisible, setEstabelecimentoMenuVisible] = useState(false);
    const openEstabelecimentoMenu = () => setEstabelecimentoMenuVisible(true);
    const closeEstabelecimentoMenu = () => setEstabelecimentoMenuVisible(false);

    // Estados do Form
    const [descricao, setDescricao] = useState('');
    const [data, setData] = useState(new Date());
    const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<DropdownItem | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Limpar lista ao iniciar
    useFocusEffect(
        useCallback(() => {
            setDescricao('');
            setData(new Date());
            setSelectedEstabelecimento(null);
        }, [])
    )

    // Handler (Nativo)
    const onChangeDateNative = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const novaData = new Date(selectedDate);
            novaData.setFullYear(data.getFullYear(), data.getMonth(), data.getDate());
            setData(novaData);
        }
    };

    // Handler (Web)
    const onChangeDate = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value) {
            setData(new Date(event.target.value));
        }
    }

    const handleSubmit = () => {
        const estId = selectedEstabelecimento ? selectedEstabelecimento.id : 'GLOBAL';
        onSubmit({
            descricao,
            data,
            estabelecimentoId: estId
        });
    };

    return (
        <View style={styles.container}>
            <TextInput
                mode="outlined"
                label="Descrição"
                value={descricao}
                onChangeText={setDescricao}
                style={styles.input}
            />

            <View style={styles.input}>
                <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.outline }}>Data</Text>
                {Platform.OS === 'web' ? (
                    <input
                        type="date"
                        value={new Date(data).toISOString().split('T')[0]}
                        onChange={onChangeDate}
                        style={{
                            padding: 12,
                            fontSize: 16,
                            borderRadius: 4,
                            border: `1px solid ${theme.colors.outline}`,
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.onSurface,
                            colorScheme: theme.dark ? 'dark' : 'light'
                        }}
                    />
                ) : (
                    <View style={styles.row}>
                        <Button 
                            mode="outlined" 
                            onPress={() => setShowDatePicker(true)}
                            icon="calendar"
                            style={{ flex: 1, marginRight: 8 }}
                        >
                            {data.toLocaleDateString('pt-BR')}
                        </Button>

                        {showDatePicker && (
                            <DateTimePicker
                                value={data}
                                mode="date"
                                display="default"
                                onChange={onChangeDateNative}
                            />
                        )}
                    </View>
                )}
            </View>

            <View style={[styles.input, { zIndex: 100 }]}>
                <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.outline }}>Aplicar para</Text>
                <Menu
                    visible={estabelecimentoMenuVisible}
                    onDismiss={closeEstabelecimentoMenu}
                    anchor={
                        <TouchableOpacity onPress={openEstabelecimentoMenu}>
                            <TextInput
                                value={estabelecimentosOpcoes.find(e => e.id === (selectedEstabelecimento ? selectedEstabelecimento.id : ''))?.name || 'Toda a Empresa (Global)'}
                                style={{ marginBottom: 16 }}
                                editable={false}
                                right={<TextInput.Icon icon="menu-down" />}
                            />
                        </TouchableOpacity>
                    }
                >
                    {estabelecimentosOpcoes.map((est) => (
                        <Menu.Item
                            key={est.id}
                            onPress={() => {
                                setSelectedEstabelecimento(est.id === 'GLOBAL' ? null : est);
                                closeEstabelecimentoMenu();
                            }}
                            title={est.name}
                        />
                    ))}
                </Menu>
            </View>

            <View style={styles.actions}>
                <Button mode="outlined" onPress={onCancel} style={{ flex: 1 }}>Cancelar</Button>
                <Button mode="contained" onPress={handleSubmit} loading={loading} style={{ flex: 1 }}>Salvar</Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    container: { 
        padding: 16 
    },
    input: { 
        marginBottom: 16 
    },
    actions: { 
        flexDirection: 'row', 
        gap: 12, 
        marginTop: 10 
    }
});