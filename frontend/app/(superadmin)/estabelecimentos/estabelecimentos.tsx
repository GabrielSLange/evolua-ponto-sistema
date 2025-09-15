import React from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { Appbar, Card, Title, Paragraph, Text, Switch, IconButton, FAB } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../../components/layouts/ScreenContainer';
import CustomLoader from '../../../components/CustomLoader';
import { useEstabelecimentos } from '../../../hooks/superadmin/useEstabelecimento';
import { ModelEstabelecimento } from '../../../models/ModelEstabelecimento';

const EstabelecimentosScreen = () => {
   const router = useRouter();
   // Pega o ID da empresa e o nome da empresa passados na navegação
   const { empresaId, empresaNome } = useLocalSearchParams<{ empresaId: string; empresaNome: string }>();

   // Usa o nosso hook (Controller) para buscar os dados
   const { estabelecimentos, loading, toggleEstabelecimentoAtivo } = useEstabelecimentos(empresaId);

   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title={`Estabelecimentos de ${empresaNome}`} />
         </Appbar.Header>
         <View style={styles.container}>
            <FlatList
               data={estabelecimentos}
               keyExtractor={(item) => item.id}
               renderItem={({ item }: { item: ModelEstabelecimento }) => (
                  <Card style={styles.card}>
                     <View style={styles.cardHeader}>
                        <Pressable>
                           {/* Ainda será implementado o clique para ver os funcionários */}
                           {/* style={styles.titleContainer}
                     onPress={() => router.push({
                        pathname: '/(superadmin)/funcionarios',
                        params: { empresaId: item.id, empresaNome: item.razaoSocial }
                     })} */}
                        </Pressable>

                        <View style={styles.switchContainer}>
                           <Text style={{ marginRight: 8 }}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
                           <Switch
                              value={item.ativo}
                              onValueChange={() => toggleEstabelecimentoAtivo(item.id)}
                           />
                        </View>

                     </View>

                     <Pressable
                     // onPress={() => router.push({
                     //    pathname: '/(superadmin)/funcionarios',
                     //    params: { empresaId: item.id, empresaNome: item.nomeFantasia }
                     // })}
                     />

                     <Card.Content>
                        <Title>{item.nomeFantasia}</Title>
                        <Paragraph>{`${item.logradouro}, ${item.numero} - ${item.bairro}`}</Paragraph>
                        <Paragraph>{`${item.cidade} / ${item.estado}`}</Paragraph>
                     </Card.Content>

                     {/* As ações ficam separadas no final */}
                     <Card.Actions style={styles.cardActions}>
                        <IconButton
                           icon="pencil"
                           onPress={() => router.push(`/estabelecimentos/edit-estabelecimento?id=${item.id}&empresaId=${empresaId}&empresaNome=${empresaNome}`)}
                        />
                     </Card.Actions>
                  </Card>
               )}
               ListEmptyComponent={<View style={styles.emptyContainer}><Text>Nenhum estabelecimento cadastrado.</Text></View>}
            />
            <FAB
               style={styles.fab}
               icon="plus"
               onPress={() => {
                  router.push(`/(superadmin)/estabelecimentos/add-estabelecimento?empresaId=${empresaId}&empresaNome=${empresaNome}`);
               }}
            />
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
});

export default EstabelecimentosScreen;