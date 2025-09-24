import { ModelEstabelecimento } from '@/models/ModelEstabelecimento';
import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

// Props que o formulário recebe
interface EstabelecimentoFormProps {
   estabelecimento?: ModelEstabelecimento;
   onSubmit: (data: ModelEstabelecimento) => void;
   isLoading: boolean;
   submitButtonLabel?: string;
}

const EstabelecimentoForm: React.FC<EstabelecimentoFormProps> = ({
   estabelecimento,
   onSubmit,
   isLoading,
   submitButtonLabel = 'Salvar',
}) => {
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

   const verificarDadosFormulario = useCallback(() => {
      console.log(estabelecimento);

      if (estabelecimento?.id !== null && estabelecimento?.id !== undefined) {
         setFormData(estabelecimento);
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

   const handleChange = (name: keyof ModelEstabelecimento, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
   };

   const handleSubmit = () => {
      onSubmit(formData);
   };

   return (
      // Usamos ScrollView para garantir que o formulário caiba em telas pequenas
      <ScrollView contentContainerStyle={styles.container}>
         <TextInput
            label="Nome Fantasia"
            value={formData.nomeFantasia}
            onChangeText={(text) => handleChange('nomeFantasia', text)}
            style={styles.input}
         />
         <TextInput
            label="CEP"
            value={formData.cep}
            onChangeText={(text) => handleChange('cep', text)}
            style={styles.input}
            keyboardType="number-pad"
         />
         <TextInput
            label="Logradouro (Rua, Av.)"
            value={formData.logradouro}
            onChangeText={(text) => handleChange('logradouro', text)}
            style={styles.input}
         />
         <TextInput
            label="Número"
            value={formData.numero}
            onChangeText={(text) => handleChange('numero', text)}
            style={styles.input}
            keyboardType="number-pad"
         />
         <TextInput
            label="Bairro"
            value={formData.bairro}
            onChangeText={(text) => handleChange('bairro', text)}
            style={styles.input}
         />
         <TextInput
            label="Cidade"
            value={formData.cidade}
            onChangeText={(text) => handleChange('cidade', text)}
            style={styles.input}
         />
         <TextInput
            label="Estado (UF)"
            value={formData.estado}
            onChangeText={(text) => handleChange('estado', text)}
            style={styles.input}
            maxLength={2}
            autoCapitalize="characters"
         />
         <TextInput
            label="Complemento"
            value={formData.complemento}
            onChangeText={(text) => handleChange('complemento', text)}
            style={styles.input}
         />
         <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
         >
            {submitButtonLabel}
         </Button>
      </ScrollView>
   );
};

const styles = StyleSheet.create({
   container: {
      padding: 16,
   },
   input: {
      marginBottom: 16,
   },
   button: {
      marginTop: 8,
   },
});

export default EstabelecimentoForm;