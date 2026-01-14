import React from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import EscalaForm from '@/components/forms/EscalaForm';
import { useAddEscala } from '@/hooks/admin/useEscala';
import { useAuth } from '@/contexts/AuthContext';

export default function AddEscalaScreen() {
    const { userId } = useAuth();
    const router = useRouter();
    const { loading, createEscala } = useAddEscala(userId || null);

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.push({
                        pathname: '/(admin)/escalas',
                    })} 
                />
            </Appbar.Header>

            <ScreenContainer>
                <EscalaForm
                    loading={loading}
                    onSubmit={createEscala}
                    onCancel={() => router.push({
                        pathname: '/(admin)/escalas',
                    })}
                />
            </ScreenContainer>
        </View>
    );
}