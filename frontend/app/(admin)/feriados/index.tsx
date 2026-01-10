import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Appbar, Divider, useTheme, Text } from 'react-native-paper';
import ScreenContainer from '@/components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';
import ListFeriados from '@/components/lists/listFeriados';
import { useFeriado } from '@/hooks/admin/useFeriado';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollView } from 'react-native-gesture-handler';

const FeriadosScreen = () => {
    const { userId } = useAuth();
    const theme = useTheme();

    const { feriados, loading } = useFeriado(userId || null);

    return (
        <View style={{ flex: 1 }}>
            <ScreenContainer>
                <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <View style={{ marginBottom: 8 }}>
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            Feriados Personalisados
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onBackground }}>
                            Gerencie os feriados personalizados para sua empresa.
                        </Text>
                    </View>

                    <Divider style={{ marginVertical: 16 }} />

                    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        <ListFeriados
                            feriados={feriados}
                            permissao="admin"
                            userId={userId}
                        />
                    </View>
                    <Modal
                        transparent={true}
                        animationType="fade"
                        visible={loading}
                    >
                        <View style={styles.loaderOverlay}>
                            <CustomLoader />
                        </View>
                    </Modal>
                </ScrollView>
            </ScreenContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    loaderOverlay: {
        flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
    padding: 16,
  }
});

export default FeriadosScreen;