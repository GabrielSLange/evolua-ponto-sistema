import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import { useEstabelecimentos } from '../../../hooks/superadmin/useEstabelecimento';
import CustomLoader from '@/components/CustomLoader';
import ListEstabelcimentos from '@/components/lists/listEstabelecimentos';
import api from '../../../services/api'; // Importar o serviço de API

const EstabelecimentosScreen = () => {
   const router = useRouter();
   // Pega o ID da empresa e o nome da empresa passados na navegação
   const { empresaId, empresaNome: initialEmpresaNome } = useLocalSearchParams<{ empresaId: string; empresaNome: string }>();

   const [displayEmpresaNome, setDisplayEmpresaNome] = useState<string | undefined>(initialEmpresaNome);
   const [fetchingEmpresaName, setFetchingEmpresaName] = useState(false);

   useEffect(() => {
      if (empresaId) {
         setFetchingEmpresaName(true);
         api.get(`/empresas/${empresaId}`) // Busca o nome da empresa pela API
            .then(response => {
               if (response.data && response.data.razaoSocial) {
                  setDisplayEmpresaNome(response.data.razaoSocial);
               } else {
                  setDisplayEmpresaNome(initialEmpresaNome); // Fallback para o nome inicial se a busca falhar
               }
            })
            .catch(error => {
               console.error("Erro ao buscar nome da empresa:", error);
               setDisplayEmpresaNome(initialEmpresaNome); // Fallback em caso de erro
            })
            .finally(() => setFetchingEmpresaName(false));
      } else {
         setDisplayEmpresaNome(initialEmpresaNome); // Se não houver empresaId, usa o nome inicial
      }
   }, [empresaId]); // Re-executa apenas se o empresaId mudar

   // Usa o nosso hook (Controller) para buscar os dados
   const { estabelecimentos, loading, toggleEstabelecimentoAtivo } = useEstabelecimentos(empresaId);

   return (
      <ScreenContainer>
         <View style={{ flex: 1 }}>
            <Appbar.Header>
               <Appbar.BackAction onPress={() => router.back()} />
               <Appbar.Content title={`Estabelecimentos de ${displayEmpresaNome || '...'}`} />
            </Appbar.Header>
            <ListEstabelcimentos
               estabelecimentos={estabelecimentos}
               permissao="superadmin"
               empresaId={empresaId}
               empresaNome={displayEmpresaNome || ''} // Passa o nome correto para o componente de lista
               userId={null}
               toggleEstabelecimentoAtivo={toggleEstabelecimentoAtivo}
            />
            <Modal
               transparent={true}
               animationType="fade"
               visible={loading || fetchingEmpresaName} // Combina os estados de carregamento
            >
               <View style={styles.loaderOverlay}>
                  <CustomLoader />
               </View>
            </Modal>
         </View>
      </ScreenContainer>
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
   loaderOverlay: {
      flex: 1, // O Modal precisa que o 'flex: 1' preencha a tela
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
   },
});

export default EstabelecimentosScreen;