import React, { useCallback, useState } from 'react';
import { FlatList, View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Card, Text, IconButton, useTheme, Chip, Portal, FAB } from 'react-native-paper';
import { Escala } from '@/hooks/admin/useEscala';
import { useFocusEffect, useRouter } from 'expo-router';
import { set } from 'date-fns';

interface Props {
    escalas: Escala[];
    permissao: string;
    empresaId?: string;
}

export default function ListEscalas({ escalas, permissao, empresaId }: Props) {
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

    const renderItem = ({ item }: { item: Escala }) => {
        // Conta quantos dias de trabalho tem na semana
        const diasTrabalho = item.dias.filter(d => !d.isFolga).length;

        return (
            <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium">{item.nome}</Text>
                        <View style={styles.infoRow}>
                            <Chip icon="clock-outline" compact style={{ marginRight: 8 }}>
                                {item.cargaHorariaSemanal}h Semanais
                            </Chip>
                            <Chip icon="calendar-week" compact>
                                {diasTrabalho} dias de trabalho
                            </Chip>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <IconButton
                            icon="pencil"
                            iconColor={theme.colors.secondary}
                            onPress={() => router.push({
                                pathname: `/(${permissao})/escalas/edit-escala`,
                                params: { escalaId: item.id }
                            })}
                        />
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={escalas}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Text style={{ color: theme.colors.outline }}>Nenhuma escala cadastrada.</Text>
                    </View>
                }
            />
            {isFocused && (
                <Portal>
                    <FAB
                        style={[styles.fab, isDesktop && styles.fabDesktop, { backgroundColor: theme.colors.primary }]}
                        color={theme.colors.onPrimary}
                        icon="plus"
                        onPress={() => {
                            router.push({
                                pathname: `/(${permissao})/escalas/add-escala`,
                                params: { empresaId: empresaId } 
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
    infoRow: {
        flexDirection: 'row',
        marginTop: 8
    },
    actions: {
        flexDirection: 'row'
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    fabDesktop: {
        right: '12%',
    },
});