import { ModelEmpresa } from '@/models/ModelEmpresa';
import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { MaskedTextInput } from "react-native-mask-text";

// Interface para as propriedades que o nosso formulário receberá
interface EmpresaFormProps {
   empresa?: ModelEmpresa; // Dados iniciais para o modo de edição
   onSubmit: (empresa: ModelEmpresa) => void; // Para controlar o estado de carregamento do botão
   submitButtonLabel?: string; // Texto customizado para o botão (ex: "Salvar", "Atualizar")
   isLoading?: boolean; // Para controlar o estado de carregamento do botão
}

const EmpresaForm: React.FC<EmpresaFormProps> = ({
   empresa,
   onSubmit,
   submitButtonLabel = 'Salvar',
}) => {
   const [loading, setLoading] = useState(false);

   const [empresaForm, setEmpresaForm] = useState<ModelEmpresa>({
      razaoSocial: '',
      cnpj: '',
      id: '',
      ativo: true
   });

   const definirDadosIniciais = useCallback(() => {
      setLoading(true);
      if (empresa !== undefined) {
         setEmpresaForm({
            razaoSocial: empresa.razaoSocial || '',
            cnpj: empresa.cnpj || '',
            id: empresa.id || '',
            ativo: empresa.ativo || true
         });
      } else {
         setEmpresaForm({
            razaoSocial: '',
            cnpj: '',
            id: '',
            ativo: true
         });
      }
      setLoading(false);
   }, [empresa]);

   useFocusEffect(definirDadosIniciais);

   const handleSubmit = () => {
      // Chama a função passada por props com os dados atuais do formulário
      onSubmit(empresaForm);
   };

   return (
      <View style={styles.container}>
         <TextInput
            label="Razão Social"
            value={empresaForm.razaoSocial}
            onChangeText={text => empresaForm.razaoSocial = text}
            style={styles.input}
         />
         <View style={styles.input}>
            <TextInput
               editable={!empresa}
               label="CNPJ"
               value={empresaForm.cnpj}
               style={styles.input}
               onChangeText={(text) => {
                  // Remove tudo que não for número
                  const rawText = text.replace(/\D/g, '');
                  empresaForm.cnpj = rawText;
               }}
               keyboardType="number-pad"
               render={props => (
                  <MaskedTextInput
                     {...props}
                     mask="99.999.999/9999-99"
                     value={empresaForm.cnpj}
                     onChangeText={text => empresaForm.cnpj = text}
                     keyboardType="number-pad"
                  />
               )}
            />
         </View>
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
      flex: 1,
      padding: 16,
   },
   input: {
      marginBottom: 16,
   },
   button: {
      marginTop: 8,
   },
});

export default EmpresaForm;