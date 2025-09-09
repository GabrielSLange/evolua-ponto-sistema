import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

// Interface para os dados do formulário
export interface EstabelecimentoFormData {
   nomeFantasia: string;
   logradouro: string;
   numero: string;
   bairro: string;
   cidade: string;
   estado: string;
   cep: string;
   complemento: string;
}

// Props que o formulário recebe
interface EstabelecimentoFormProps {
   initialData?: EstabelecimentoFormData;
   onSubmit: (data: EstabelecimentoFormData) => void;
   isLoading: boolean;
   submitButtonLabel?: string;
}

const EstabelecimentoForm: React.FC<EstabelecimentoFormProps> = ({
   initialData,
   onSubmit,
   isLoading,
   submitButtonLabel = 'Salvar',
}) => {
   const [formData, setFormData] = useState<EstabelecimentoFormData>({
      nomeFantasia: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      complemento: '',
   });

   useEffect(() => {
      if (initialData) {
         setFormData(initialData);
      } else {
         // Limpa o formulário no modo de criação
         setFormData({
            nomeFantasia: '', logradouro: '', numero: '', bairro: '',
            cidade: '', estado: '', cep: '', complemento: ''
         });
      }
   }, [initialData]);

   const handleChange = (name: keyof EstabelecimentoFormData, value: string) => {
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