import React, { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Card, Text, Chip, useTheme, Portal, FAB, Switch } from 'react-native-paper';
import { FeriadoView } from '@/hooks/admin/useFeriado';
import { useFocusEffect, useRouter } from 'expo-router/build/exports';

interface Props {
    feriados: FeriadoView[];
    permissao: string;
    toggleFeriadoAtivo: (id: string) => void;
}

export default function ListFeriados({ feriados, permissao, toggleFeriadoAtivo }: Props) {
    const router = useRouter();
    const theme = useTheme();

    const { width } = useWindowDimensions();
    const isDesktop = Platform.OS === 'web' && width > 768;
    const [isFocused, setIsFocused] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsFocused(true); // Mostra o botão ao entrar
            return () => {
                setIsFocused(false); // Esconde o botão ao sair
            };
        }, [])
    );

    const renderItem = ({ item }: { item: FeriadoView }) => {
        const dataObj = new Date(item.data);
        dataObj.setMinutes(dataObj.getMinutes() + dataObj.getTimezoneOffset());

        const isNacional = item.tipo === 'NACIONAL';
        const isGlobalPersonalizado = item.tipo === 'PERSONALIZADO' && !item.estabelecimentoId;

        // Define cor e ícone da Chip
        let chipIcon = "store";
        let chipLabel = item.estabelecimento?.nomeFantasia || "Unidade";
        let chipColor = undefined;

        if (isNacional) {
            chipIcon = "flag-variant";
            chipLabel = "Nacional";
            chipColor = theme.colors.tertiaryContainer;
        } else if (isGlobalPersonalizado) {
            chipIcon = "earth";
            chipLabel = "Global (Empresa)";
            chipColor = theme.colors.secondaryContainer
        }

        return (
            <Card style={[styles.card, { borderLeftColor: isNacional ? theme.colors.tertiary : (isGlobalPersonalizado ? theme.colors.primary : theme.colors.outline), borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                    <View>
                        <Text variant="titleMedium">{item.descricao}</Text>
                        <Text variant="bodyMedium">
                            {dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Text>

                        <View style={{ flexDirection: 'row', marginTop: 6 }}>
                            <Chip
                                icon={chipIcon}
                                compact
                                textStyle={{ fontSize: 10 }}
                                style={{ backgroundColor: chipColor }}
                            >
                                {chipLabel}
                            </Chip>
                        </View>
                    </View>

                    {!isNacional && (
                        <View style={styles.switchContainer}>
                            <Text style={{ marginRight: 8 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                            <Switch
                                value={item.ativo}
                                onValueChange={() => {
                                    toggleFeriadoAtivo(item.id as string);
                                }}
                            />
                        </View>
                    )}

                    {isNacional && (
                        <View style={{opacity: 0.5}}>
                            <Text variant="labelSmall">Feriado Fixo</Text>
                        </View>
                    )}

                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={feriados}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: theme.colors.outline }}>Nenhum feriado cadastrado.</Text>
                    </View>
                }
            />
            {isFocused && (
                <Portal>
                    <FAB
                        style={[styles.fab, isDesktop && styles.fabDesktop]}
                        icon="plus"
                        onPress={() => {
                            router.push({
                                pathname: `/(${permissao})/feriados/add-feriado`,
                            });
                        }}
                    />
                </Portal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    fabDesktop: {
        right: '13%',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});