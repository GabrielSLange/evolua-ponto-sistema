import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

// Interface para os dados da empresa que o formulário manipula
export interface EmpresaFormData {
   id: string;
   razaoSocial: string;
   cnpj: string;
}

// Interface para as propriedades que o nosso formulário receberá
interface EmpresaFormProps {
   initialData?: EmpresaFormData; // Dados iniciais para o modo de edição
   onSubmit: (data: EmpresaFormData) => void; // Função a ser chamada ao submeter
   isLoading: boolean; // Para controlar o estado de carregamento do botão
   submitButtonLabel?: string; // Texto customizado para o botão (ex: "Salvar", "Atualizar")
}

const EmpresaForm: React.FC<EmpresaFormProps> = ({
   initialData,
   onSubmit,
   isLoading,
   submitButtonLabel = 'Salvar', // Valor padrão para o texto do botão
}) => {
   const [loading, setLoading] = useState(false);
   const [razaoSocial, setRazaoSocial] = useState('');
   const [cnpj, setCnpj] = useState('');

   // useEffect para preencher o formulário com dados iniciais (para o modo de edição)
   useEffect(() => {
      setLoading(true);
      // Se recebermos dados iniciais (modo de edição), preenchemos os campos.
      if (initialData) {
         setRazaoSocial(initialData.razaoSocial || '');
         setCnpj(initialData.cnpj || '');
      } else {
         // Se NÃO recebermos dados (modo de criação), LIMPAMOS os campos.
         setRazaoSocial('');
         setCnpj('');
      }
      setLoading(false);
   }, [initialData]);

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
            loading={isLoading}
            disabled={isLoading}
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