import React, {  } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import CustomLoader from '@/components/CustomLoader';
import EscalaForm from '@/components/forms/EscalaForm';
import { useEditEscala } from '@/hooks/admin/useEscala';
import { useAuth } from '@/contexts/AuthContext';

const EditEscalaScreen = () => {
    const { userId } = useAuth();
    const router = useRouter();
    const { escalaId } = useLocalSearchParams<{ escalaId: string }>();
    const { loading, escala, updateEscala } = useEditEscala(userId, escalaId);

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.push({
                    pathname: '/(superadmin)/escalas',
                })}
                />
            </Appbar.Header>

            <ScreenContainer>
                <View style={{ flex: 1 }}>

                    <EscalaForm
                        initialData={escala}
                        loading={loading}
                        onSubmit={(data) => updateEscala(escalaId, data)}
                        onCancel={() => router.push({
                            pathname: '/(superadmin)/escalas',
                        })}
                        isEdit={true}
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
                </View>
            </ScreenContainer>
        </View>
    );
};

const styles = StyleSheet.create({
   loaderOverlay: {
      flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
   },
});

export default EditEscalaScreen;