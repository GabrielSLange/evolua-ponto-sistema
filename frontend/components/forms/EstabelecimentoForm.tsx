import { ModelEstabelecimento } from '@/models/ModelEstabelecimento';
import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Fieldset } from '../layouts/FieldSet';
import { SearchableDropdown } from '../layouts/SearchableDropdown';

// Props que o formulário recebe
interface EstabelecimentoFormProps {
   estabelecimento?: ModelEstabelecimento;
   onSubmit: (data: ModelEstabelecimento) => void;
   submitButtonLabel?: string;
}

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
   });
   const [cidades, setCidades] = useState<string[]>([]);
   const [estados, setEstados] = useState<string[]>([]);

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

      }
   };

   const handleChange = (name: keyof ModelEstabelecimento, value: string) => {
      if (name === 'cep') {
         const cepFormatado = formatarCep(value);
         setFormData(prev => ({ ...prev, cep: cepFormatado }));

         if (cepFormatado.length === 9) {
            buscarCepBrasilApi(cepFormatado);
         }
         return;
      }

      if (name === 'estado') {
         BuscarCidadesDoEstado(value);
      }

      setFormData(prev => ({ ...prev, [name]: value as any }));
   };

   const handleSubmit = () => {
      const dadosParaEnviar = {
         ...formData,
         cep: formData.cep ? formData.cep.replace(/\D/g, '') : '',
      };
      onSubmit(dadosParaEnviar);
   };


   const verificarDadosFormulario = useCallback(() => {
      BuscarEstados();

      if (estabelecimento?.id) {
         const cepFormatado = estabelecimento.cep ? formatarCep(estabelecimento.cep) : '';
         setFormData({ ...estabelecimento, cep: cepFormatado });
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
         });
      }
   }, [estabelecimento]);
   useFocusEffect(verificarDadosFormulario);

   return (
      <View style={styles.container}>
         <TextInput
            label="Nome Fantasia"
            value={formData.nomeFantasia}
            onChangeText={(text) => handleChange('nomeFantasia', text)}
            style={styles.input}
         />
         <Fieldset legend="Endereço">
            <View style={[{ flexDirection: isDesktop ? 'row' : 'column' }]}>
               <View style={{ flex: 2.5, margin: isDesktop ? 8 : 0 }}>
                  <TextInput
                     label="CEP"
                     value={formData.cep}
                     onChangeText={(text) => handleChange('cep', text)}
                     style={styles.input}
                     keyboardType="number-pad"
                     maxLength={9}
                  />
                  <TextInput
                     label="Logradouro (Rua, Av.)"
                     value={formData.logradouro}
                     onChangeText={(text) => handleChange('logradouro', text)}
                     style={styles.input}
                  />
                  <TextInput
                     label="Número"
                     value={formData.numero ?? ''}
                     onChangeText={(text) => handleChange('numero', text)}
                     style={styles.input}
                     keyboardType="number-pad"
                  />
               </View>

               <View style={{ flex: 2.5, margin: isDesktop ? 8 : 0 }}>
                  <TextInput
                     label="Bairro"
                     value={formData.bairro}
                     onChangeText={(text) => handleChange('bairro', text)}
                     style={styles.input}
                  />
                  <SearchableDropdown
                     label="Estado (UF)"
                     value={formData.estado}
                     options={estados}
                     onSelect={(text) => handleChange('estado', text)}
                     style={styles.input}
                  />
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

            <View style={{ margin: isDesktop ? 8 : 0 }} >
               <TextInput
                  label="Complemento"
                  value={formData.complemento ?? ''}
                  onChangeText={(text) => handleChange('complemento', text)}
                  style={styles.input}
               />
            </View>
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