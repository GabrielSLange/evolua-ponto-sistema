import { ModelEmpresa } from '@/models/ModelEmpresa';
import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

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
      onSubmit({ razaoSocial, cnpj, id: initialData?.id || '' });
   };

   return (
      <View style={styles.container}>
         <TextInput
            label="Razão Social"
            value={razaoSocial}
            onChangeText={setRazaoSocial}
            style={styles.input}
         />
         <TextInput
            label="CNPJ"
            value={cnpj}
            onChangeText={setCnpj}
            style={styles.input}
            keyboardType="number-pad"
         />
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