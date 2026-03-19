import React from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import EscalaForm from '@/components/forms/EscalaForm';
import { useAddEscala } from '@/hooks/superadmin/useEscala';
import { useAuth } from '@/contexts/AuthContext';

export default function AddEscalaScreen() {
    const { userId } = useAuth();
    const router = useRouter();
    const { empresaId } = useLocalSearchParams();
    const { loading, createEscala } = useAddEscala(empresaId as string || null);

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
            </Appbar.Header>

            <ScreenContainer>
                <EscalaForm
                    loading={loading}
                    onSubmit={createEscala}
                    onCancel={() => router.back()}
                />
            </ScreenContainer>
        </View>
    );
}