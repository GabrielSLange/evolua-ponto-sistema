import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useTheme, Text, Divider } from 'react-native-paper';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';
import ListEscalas from '@/components/lists/listEscalas';
import { useEscala } from '@/hooks/superadmin/useEscala';
import { useLocalSearchParams } from 'expo-router';

export default function EscalasIndex() {
    const theme = useTheme();

    const { empresaId } = useLocalSearchParams();
    const { escalas, loading } = useEscala(empresaId as string || null);
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
                <ListEscalas
                    escalas={escalas}
                    permissao="superadmin"
                    empresaId={empresaId as string || undefined}
                />
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={loading}
                >
                    <View style={styles.loaderOverlay}>
                        <CustomLoader />
                    </View>
                </Modal>
            </ScreenContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 16,
        backgroundColor: 'transparent',
    },
    loaderOverlay: {
      flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
   },
});