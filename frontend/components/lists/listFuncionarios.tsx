import React from "react";
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Card, Title, Paragraph, Text, Switch, IconButton, FAB, Tooltip, useTheme, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ModelFuncionario } from '../../models/ModelFuncionario';

interface ListFuncionariosProps {
    funcionarios: ModelFuncionario[];
    permissao: string;
    userId: string | null;
    estabelecimentoId?: string;
    toggleFuncionarioAtivo: (id: string) => void;
}

const ListFuncionarios: React.FC<ListFuncionariosProps> = ({
    funcionarios,
    permissao,
    userId,
    estabelecimentoId,
    toggleFuncionarioAtivo,
}) => {
    const router = useRouter();
    const theme = useTheme();
    const iconColor = theme.colors.secondary;
    // Pega o ID da empresa e o nome da empresa passados na navegação


    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={funcionarios}
                keyExtractor={(item) => item.id as string}
                contentContainerStyle={styles.listContentContainer}
                renderItem={({ item }: { item: ModelFuncionario }) => (
                    <Card style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Pressable
                                style={styles.titleContainer}
                                onPress={() => router.push({
                                    pathname: `/(${permissao})/funcionarios/edit-funcionario`,
                                    params: { funcionarioId: item.id, estabelecimentoId: estabelecimentoId, isReadOnly: 'true' }
                                })}
                            >
                                <Title>{item.nome}</Title>
                            </Pressable>

                            <View style={styles.switchContainer}>
                                <Text style={{ marginRight: 8 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                                <Switch
                                    value={item.ativo}
                                    onValueChange={() => toggleFuncionarioAtivo(item.id as string)}
                                />
                            </View>

                        </View>

                        <Pressable
                            onPress={() => router.push({
                                pathname: `/(${permissao})/funcionarios/edit-funcionario`,
                                params: { funcionarioId: item.id, estabelecimentoId: estabelecimentoId, isReadOnly: 'true' }
                            })}
                        >
                            <Card.Content>
                                <Paragraph>
                                    <Icon source="card-account-details-outline" size={18} color=""></Icon> CPF: {item.cpf}
                                </Paragraph>
                                <Paragraph>
                                    <Icon source="briefcase-outline" size={18} color=""></Icon> Cargo: {item.cargo}
                                </Paragraph>
                            </Card.Content>
                        </Pressable>

                        <Card.Actions style={styles.cardActions}>
                            <View style={{ flexDirection: 'row' }}>
                                <Tooltip title="Editar Funcionário" enterTouchDelay={0} leaveTouchDelay={0}>
                                    <IconButton
                                        icon="pencil"
                                        iconColor={iconColor}
                                        onPress={() => router.push({
                                            pathname: `/(${permissao})/funcionarios/edit-funcionario`,
                                            params: { funcionarioId: item.id, estabelecimentoId: estabelecimentoId, isReadOnly: 'false' }
                                        })}
                                    />
                                </Tooltip>
                            </View>
                        </Card.Actions>
                    </Card>
                )}
                ListEmptyComponent={<View style={styles.emptyContainer}><Text>Nenhum funcionário encontrado.</Text></View>}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => {
                    router.push({
                        pathname: `/(${permissao})/funcionarios/add-funcionario`,
                        params: { estabelecimentoId: estabelecimentoId }
                    });
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        margin: 8
    },
    emptyContainer: {
        flex: 1, marginTop: 50, alignItems: 'center'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    titleContainer: {
        flex: 1, // Faz o título ocupar o espaço disponível
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardActions: {
        justifyContent: 'flex-end', // Alinha o botão de editar à direita
    },
    container: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    listContentContainer: {
        paddingBottom: 80,
    }
});

export default ListFuncionarios;