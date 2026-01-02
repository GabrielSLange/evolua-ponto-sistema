import { ModelEstabelecimento } from '@/models/ModelEstabelecimento';
import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { Fieldset } from '../layouts/FieldSet';
import { SearchableDropdown } from '../layouts/SearchableDropdown';
import { InteractiveMap } from '../maps/InteractiveMap';
import { Text } from '../Themed';

// Props que o formulário recebe
interface EstabelecimentoFormProps {
   estabelecimento?: ModelEstabelecimento;
   onSubmit: (data: ModelEstabelecimento) => void;
   submitButtonLabel?: string;
}

const defaultRegion = {
   latitude: -15.7801, // Centro do Brasil
   longitude: -47.9292,
   latitudeDelta: 10, // Zoom para ver o país todo
   longitudeDelta: 10,
};

// Define a estrutura do objeto de erros
type FormErrors = Partial<Record<keyof ModelEstabelecimento, string>>;

const EstabelecimentoForm: React.FC<EstabelecimentoFormProps> = ({
   estabelecimento,
   onSubmit,
   submitButtonLabel = 'Salvar',
}) => {

   const { width } = useWindowDimensions();
   const isDesktop = width > 768;

   const [formData, setFormData] = useState<ModelEstabelecimento>({
      id: '',
      empresaId: '',
      nomeFantasia: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      cep: '',
      complemento: '',
      estado: '',
      ativo: true,
      latitude: 0,
      longitude: 0,
      raioKm: 1,
   });

   // Estado para armazenar as mensagens de erro
   const [errors, setErrors] = useState<FormErrors>({});

   const [mapRegion, setMapRegion] = useState(() => {
      if (estabelecimento?.latitude && estabelecimento?.longitude) {
         return {
            latitude: estabelecimento.latitude,
            longitude: estabelecimento.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
         };
      }
      return defaultRegion;
   });
   const [cidades, setCidades] = useState<string[]>([]);
   const [estados, setEstados] = useState<string[]>([]);

   const theme = useTheme();

   const atualizaRegiaoMapa = async (logradouro: string, cidade: string, estado: string) => {

      const addressString = `${logradouro}, ${cidade}, ${estado}, Brazil`;
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressString)}&format=json&limit=1`);
      const geoData = await geoResponse.json();

      if (geoData && geoData.length > 0) {
         const { lat, lon } = geoData[0];
         // 3. Atualiza a região do mapa
         setMapRegion({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            latitudeDelta: 0.01, // Zoom mais próximo
            longitudeDelta: 0.01,
         });
      }
   }



   const handleMapPress = (coords: { latitude: number; longitude: number }) => {
      const { latitude, longitude } = coords;

      // 1. Atualiza a localização do pin no formulário
      setFormData(prevState => ({
         ...prevState,
         latitude,
         longitude,
      }));

      // 2. ATUALIZA A VISÃO DO MAPA para centralizar no novo pin
      setMapRegion(prevRegion => ({
         ...prevRegion, // Mantém o nível de zoom (delta)
         latitude,
         longitude,
      }));

      setErrors(prev => ({ ...prev, latitude: undefined }));
   };

   const BuscarEstados = async () => {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados`);
      if (response.ok) {
         const dadosApi: { sigla: string }[] = await response.json(); // Armazena todos os dados para filtragem posterior
         setEstados([...new Set(dadosApi.map(item => item.sigla))].sort());
      }
   }

   const BuscarCidadesDoEstado = async (estado: string) => {
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
      if (response.ok) {
         const dadosApi: { nome: string }[] = await response.json();
         await setCidades([...new Set(dadosApi.map(item => item.nome))].sort());
      }
   }

   const formatarCep = (cep: string) => {
      if (!cep) return '';
      const cepNumeros = cep.replace(/\D/g, '');
      let cepFormatado = cepNumeros;
      if (cepNumeros.length > 5) {
         cepFormatado = `${cepNumeros.slice(0, 5)}-${cepNumeros.slice(5, 8)}`;
      }
      return cepFormatado;
   };

   const buscarCepBrasilApi = async (cep: string) => {
      const cepNumeros = cep.replace(/\D/g, '');
      if (cepNumeros.length !== 8) {
         return;
      }
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepNumeros}`);
      if (response.ok) {

         const data = await response.json();
         BuscarCidadesDoEstado(data.state);
         setFormData(prev => ({
            ...prev,
            cep: prev.cep,
            logradouro: data.street,
            bairro: data.neighborhood,
            cidade: data.city,
            estado: data.state,
         }));

         atualizaRegiaoMapa(data.street, data.city, data.state);
      }
   };

   const handleChange = (name: keyof ModelEstabelecimento, value: string) => {
      // Limpa o erro específico ao modificar o campo
      if (errors[name]) {
         setErrors(prev => ({ ...prev, [name]: undefined }));
      }

      if (name === 'cep') {
         const cepFormatado = formatarCep(value);
         setFormData(prev => ({ ...prev, cep: cepFormatado }));

         if (cepFormatado.length === 9) {
            buscarCepBrasilApi(cepFormatado);

            setErrors(prev => ({
               ...prev,
               logradouro: undefined,
               bairro: undefined,
               cidade: undefined,
               estado: undefined,
            }));
         }
         return;
      }

      if (name === 'estado') {
         BuscarCidadesDoEstado(value);
      }

      setFormData(prev => ({ ...prev, [name]: value as any }));
   };

   const handleSubmit = () => {
      // Lógica para validação para construir o objeto de erros
      const newErrors: FormErrors = {};

      if (!formData.nomeFantasia) newErrors.nomeFantasia = 'O nome fantasia é obrigatório.';
      if (!formData.cep) newErrors.cep = 'O CEP é obrigatório.';
      if (!formData.logradouro) newErrors.logradouro = 'O logradouro é obrigatório.';
      if (!formData.numero) newErrors.numero = 'Caso não tenha número, informe "S/N".';
      if (!formData.bairro) newErrors.bairro = 'O bairro é obrigatório.';
      if (!formData.cidade) newErrors.cidade = 'A cidade é obrigatória.';
      if (!formData.estado) newErrors.estado = 'O estado é obrigatório.';
      if (!formData.latitude || !formData.longitude) newErrors.latitude = 'A localização no mapa é obrigatória.';

      setErrors(newErrors);

      // Se não houver erros, envia o formulário
      if (Object.keys(newErrors).length === 0) {
         try  {
            const dadosParaEnviar = {
               ...formData,
               cep: formData.cep ? formData.cep.replace(/\D/g, '') : '',
            };
            onSubmit(dadosParaEnviar);
         } catch (error) {
            return;
         }

      } else {
         return;
      }
   };


   const verificarDadosFormulario = useCallback(() => {
      BuscarEstados();
      if (estabelecimento?.id) {
         const cepFormatado = estabelecimento.cep ? formatarCep(estabelecimento.cep) : '';
         setFormData({ ...estabelecimento, cep: cepFormatado });
         if (estabelecimento.latitude && estabelecimento.longitude && estabelecimento.latitude !== 0) {
            setMapRegion({
               latitude: estabelecimento.latitude,
               longitude: estabelecimento.longitude,
               latitudeDelta: 0.005,
               longitudeDelta: 0.005,
            });
         }
      } else {
         // Limpa o formulário no modo de criação
         setFormData({
            id: '',
            empresaId: '',
            nomeFantasia: '',
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            cep: '',
            complemento: '',
            estado: '',
            ativo: true,
            latitude: 0,
            longitude: 0,
            raioKm: 1,
         });
      }
      // Limpa os erros ao carregar o formulário
      setErrors({});
   }, [estabelecimento]);
   useFocusEffect(verificarDadosFormulario);



   return (
      <View style={styles.container}>
         <HelperText type="error" visible={!!errors.nomeFantasia}>
            {errors.nomeFantasia}
         </HelperText>
         <TextInput
            label="Nome Fantasia"
            value={formData.nomeFantasia}
            onChangeText={(text) => handleChange('nomeFantasia', text)}
            style={styles.input}
            error={!!errors.nomeFantasia}
         />
         <Fieldset legend="Endereço">
            <View style={[{ flexDirection: isDesktop ? 'row' : 'column' }]}>
               <View style={{ flex: 2.5, margin: isDesktop ? 8 : 0 }}>
                  <HelperText type="error" visible={!!errors.cep}>
                     {errors.cep}
                  </HelperText>
                  <TextInput
                     label="CEP"
                     value={formData.cep}
                     onChangeText={(text) => handleChange('cep', text)}
                     style={styles.input}
                     keyboardType="number-pad"
                     maxLength={9}
                  />

                  <HelperText type="error" visible={!!errors.logradouro}>
                     {errors.logradouro}
                  </HelperText>
                  <TextInput
                     label="Logradouro (Rua, Av.)"
                     value={formData.logradouro}
                     onChangeText={(text) => handleChange('logradouro', text)}
                     style={styles.input}
                  />

                  <HelperText type="error" visible={!!errors.numero}>
                     {errors.numero}
                  </HelperText>
                  <TextInput
                     label="Número"
                     value={formData.numero ?? ''}
                     onChangeText={(text) => handleChange('numero', text)}
                     style={styles.input}
                     keyboardType="number-pad"
                  />
               </View>

               <View style={{ flex: 2.5, margin: isDesktop ? 8 : 0 }}>
                  <HelperText type="error" visible={!!errors.bairro}>
                     {errors.bairro}
                  </HelperText>
                  <TextInput
                     label="Bairro"
                     value={formData.bairro}
                     onChangeText={(text) => handleChange('bairro', text)}
                     style={styles.input}
                  />

                  <HelperText type="error" visible={!!errors.estado}>
                     {errors.estado}
                  </HelperText>
                  <SearchableDropdown
                     label="Estado (UF)"
                     value={formData.estado}
                     options={estados}
                     onSelect={(text) => handleChange('estado', text)}
                     style={styles.input}
                  />

                  <HelperText type="error" visible={!!errors.cidade}>
                     {errors.cidade}
                  </HelperText>
                  <SearchableDropdown
                     label="Cidade"
                     value={formData.cidade}
                     options={cidades}
                     textoVazio='Selecione um estado primeiro'
                     onSelect={(text) => handleChange('cidade', text)}
                     style={styles.input}
                  />
               </View>
            </View>

            <View style={[{ marginBottom: isDesktop ? 0 : 35, flexDirection: isDesktop ? 'row' : 'column' }]}>
               <View style={{flex: 7, margin: isDesktop ? 8 : 0 }} >
                  <TextInput
                     label="Complemento"
                     value={formData.complemento ?? ''}
                     onChangeText={(text) => handleChange('complemento', text)}
                     style={styles.input}
                  />
               </View>
               <View style={{ flex: 3, margin: isDesktop ? 8 : 0 }} >
                  <TextInput
                     label="Raio de atuação (km)"
                     value={String(formData.raioKm ?? 1)}
                     onChangeText={(text) => handleChange('raioKm', text)}
                     style={styles.input}
                     keyboardType="number-pad"
                  />
               </View>
            </View>
            <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Clique no Mapa para definir a localização:</Text>
            <View
               style={{
                  borderBottomColor: '#ccc', // Cor da linha
                  borderBottomWidth: 1,      // Espessura da linha
                  marginVertical: 10,        // Espaçamento acima e abaixo da linha
               }}
            />

            <InteractiveMap
               region={mapRegion} // Passamos a região controlada pelo estado
               onMapPress={handleMapPress}
               markerCoordinate={
                  formData.latitude && formData.longitude
                     ? { latitude: formData.latitude, longitude: formData.longitude }
                     : null
               }
            />
            <Text style={{ color: theme.colors.onSurface }}>Latitude: {formData.latitude} Longitude: {formData.longitude}</Text>
            <HelperText type="error" visible={!!errors.latitude || !!errors.longitude}>
               {errors.latitude}
            </HelperText>



         </Fieldset>


         <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
         >
            {submitButtonLabel}
         </Button>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      padding: 16,
      justifyContent: 'center',
   },
   input: {
      marginBottom: 16,
   },
   button: {
      margin: 7,
   },
});

export default EstabelecimentoForm;