import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Title, Paragraph, FAB, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import CustomLoader from '../../components/CustomLoader';
import ScreenContainer from '../../components/layouts/ScreenContainer';
import { useEmpresa } from '@/hooks/superadmin/useEmpresa';



const SuperAdminScreen = () => {
   const { empresas, loading } = useEmpresa();
   const router = useRouter();


   if (loading) {
      return <CustomLoader />;
   }

   return (
      <ScreenContainer>
         <View style={styles.container}>
            <FlatList
               data={empresas}
               keyExtractor={(item) => item.id}
               contentContainerStyle={styles.listContentContainer}
               renderItem={({ item }) => (
                  <Card style={styles.card}>
                     <Card.Content>
                        <Title>{item.razaoSocial}</Title>
                        <Paragraph>CNPJ: {item.cnpj}</Paragraph>
                     </Card.Content>
                     <Card.Actions>
                        <IconButton icon="pencil" onPress={() => router.push(`/(superadmin)/edit-empresa?id=${item.id}`)}>
                        </IconButton>
                     </Card.Actions>
                  </Card>
               )}
               ListEmptyComponent={<View style={styles.emptyContainer}><Text>Nenhuma empresa cadastrada.</Text></View>}
            />
            <FAB
               style={styles.fab}
               icon="plus"
               onPress={() => {
                  router.push('/(superadmin)/add-empresa');
               }}
            />
         </View>
      </ScreenContainer>
   );
};

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   card: {
      margin: 8,
   },
   fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
   },
   emptyContainer: {
      flex: 1,
      marginTop: 50,
      alignItems: 'center',
      justifyContent: 'center',
   },
   editButton: {
      marginRight: 'auto',

   },
   listContentContainer: {
      paddingBottom: 80,
   }
});

export default SuperAdminScreen;