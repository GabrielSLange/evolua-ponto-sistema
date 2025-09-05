import { ModelEmpresa } from '@/models/ModelEmpresa';
import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { MaskedTextInput } from "react-native-mask-text";

// Interface para as propriedades que o nosso formulário receberá
interface EmpresaFormProps {
   initialData?: ModelEmpresa; // Dados iniciais para o modo de edição
   onSubmit: (data: ModelEmpresa) => void; // Para controlar o estado de carregamento do botão
   submitButtonLabel?: string; // Texto customizado para o botão (ex: "Salvar", "Atualizar")
}

const EmpresaForm: React.FC<EmpresaFormProps> = ({
   initialData,
   onSubmit,
   submitButtonLabel = 'Salvar',
}) => {
   const [loading, setLoading] = useState(false);
   const [razaoSocial, setRazaoSocial] = useState('');
   const [cnpj, setCnpj] = useState('');

   const definirDadosIniciais = useCallback(() => {
      setLoading(true);
      if (initialData != undefined) {
         setRazaoSocial(initialData.razaoSocial || '');
         setCnpj(initialData.cnpj || '');
      } else {
         setRazaoSocial('');
         setCnpj('');
      }
      setLoading(false);
   }, [initialData]);

   useFocusEffect(definirDadosIniciais);

   const handleSubmit = () => {
      // Chama a função passada por props com os dados atuais do formulário
      onSubmit({
         razaoSocial,
         cnpj,
         id: initialData?.id || '',
         ativo: initialData?.ativo ?? true // ou false, dependendo do padrão desejado
      });
   };

   return (
      <View style={styles.container}>
         <TextInput
            label="Razão Social"
            value={razaoSocial}
            onChangeText={setRazaoSocial}
            style={styles.input}
         />
         <View style={styles.input}>
            <TextInput
               editable={!initialData}
               label="CNPJ"
               value={cnpj}
               onChangeText={(text) => {
                  // Remove tudo que não for número
                  const rawText = text.replace(/\D/g, '');
                  setCnpj(rawText);
               }}
               keyboardType="number-pad"
               render={props => (
                  <MaskedTextInput
                     {...props}
                     mask="99.999.999/9999-99"
                     value={cnpj}
                     onChangeText={(text, rawText) => setCnpj(rawText)}
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