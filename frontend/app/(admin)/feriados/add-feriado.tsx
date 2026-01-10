import React from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ScreenContainer from '@/components/layouts/ScreenContainer';
import FeriadoForm from '@/components/forms/FeriadoForm';
import { useAddFeriado } from '@/hooks/admin/useFeriado';
import { useAuth } from '@/contexts/AuthContext';

export default function AddFeriadoScreen() {
    const router = useRouter();
    const { userId } = useAuth();
    const { loading, addFeriado, estabelecimentosOpcoes } = useAddFeriado(userId as string);

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.push({
                    pathname: '/(admin)/feriados',
                })} />
                <Appbar.Content title="Novo Feriado" />
            </Appbar.Header>

            <ScreenContainer>
                <FeriadoForm
                    estabelecimentosOpcoes={estabelecimentosOpcoes}
                    loading={loading}
                    onSubmit={addFeriado}
                    onCancel={() => router.push({
                        pathname: '/(admin)/feriados',
                    })}
                />
            </ScreenContainer>
        </View>
    );
}