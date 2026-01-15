import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB, useTheme, Text, Divider } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';
import ListEscalas from '@/components/lists/listEscalas';
import { useEscala } from '@/hooks/admin/useEscala';
import { useAuth } from '@/contexts/AuthContext';

export default function EscalasIndex() {
    const { userId } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const { escalas, loading } = useEscala(userId || null);

    return (
        <View style={{ flex: 1 }}>
            <ScreenContainer>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>Escalas de Trabalho</Text>
                    <Text variant="bodyMedium" style={{ color: '#666' }}>
                        Gerencie as escalas de trabalho cadastradas.
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    <Divider style={{ marginBottom: 16, marginTop: 8}} />
                </View>

                {loading && !escalas.length ? (
                    <CustomLoader />
                ) : (
                    <ListEscalas
                        escalas={escalas}
                        permissao="admin"
                    />
                )}
            </ScreenContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 16,
        backgroundColor: 'transparent',
    },
});