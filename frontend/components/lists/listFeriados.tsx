import React, { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Card, Text, IconButton, Chip, useTheme, Portal, FAB, Switch } from 'react-native-paper';
import { FeriadoPersonalizado } from '@/hooks/admin/useFeriado';
import { useFocusEffect, useRouter } from 'expo-router/build/exports';

interface Props {
    feriados: FeriadoPersonalizado[];
    permissao: string;
    userId: string | null;
    toggleFeriadoAtivo: (id: string) => void;
}

export default function ListFeriados({ feriados, permissao, userId, toggleFeriadoAtivo }: Props) {
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

    const renderItem = ({ item }: { item: FeriadoPersonalizado }) => {
        const dataObj = new Date(item.data);
        // Ajuste visual de timezone se necessário
        dataObj.setMinutes(dataObj.getMinutes() + dataObj.getTimezoneOffset());

        const isGlobal = !item.estabelecimentoId;

        return (
            <Card style={[styles.card, { borderLeftColor: isGlobal ? theme.colors.primary : theme.colors.tertiary, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                    <View>
                        <Text variant="titleMedium">{item.descricao}</Text>
                        <Text variant="bodyMedium">
                            {dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Text>

                        <View style={{ flexDirection: 'row', marginTop: 6 }}>
                            <Chip
                                icon={isGlobal ? "earth" : "store"}
                                compact
                                textStyle={{ fontSize: 10 }}
                                style={{ backgroundColor: isGlobal ? theme.colors.elevation.level2 : undefined }}
                            >
                                {isGlobal ? "Global" : item.estabelecimento?.nomeFantasia || "Unidade Específica"}
                            </Chip>
                        </View>
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={{ marginRight: 8 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                        <Switch
                            value={item.ativo}
                            onValueChange={() => {
                                toggleFeriadoAtivo(item.id as string);
                            }}
                        />
                    </View>
                                    
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