import { ModelEmpresa } from '@/models/ModelEmpresa';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Switch, Text } from 'react-native-paper';
import { MaskedTextInput } from "react-native-mask-text";

interface EmpresaFormProps {
   empresa?: ModelEmpresa;
   onSubmit: (empresa: ModelEmpresa) => void;
   submitButtonLabel?: string;
   isLoading?: boolean;
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
      ativo: true,
      UsaModuloEventos: false
   });

   useEffect(() => {
      setLoading(true);
      if (empresa !== undefined) {
         
         const valorToggle = empresa.UsaModuloEventos ?? (empresa as any).usaModuloEventos ?? false;

         setEmpresaForm({
            razaoSocial: empresa.razaoSocial || '',
            cnpj: empresa.cnpj || '',
            id: empresa.id || '',
            ativo: empresa.ativo !== undefined ? empresa.ativo : true,
            UsaModuloEventos: valorToggle
         });
      } else {
         setEmpresaForm({
            razaoSocial: '',
            cnpj: '',
            id: '',
            ativo: true,
            UsaModuloEventos: false
         });
      }
      setLoading(false);
   }, [empresa]);

   const handleSubmit = () => {
      onSubmit(empresaForm);
   };

   return (
      <View style={styles.container}>
         <TextInput
            label="Razão Social"
            value={empresaForm.razaoSocial}
            onChangeText={text => setEmpresaForm(prev => ({ ...prev, razaoSocial: text }))}
            style={styles.input}
         />
         <View style={styles.input}>
            <TextInput
               editable={!empresa}
               label="CNPJ"
               value={empresaForm.cnpj}
               style={styles.input}
               onChangeText={(text) => {
                  const rawText = text.replace(/\D/g, '');
                  setEmpresaForm(prev => ({ ...prev, cnpj: rawText }));
               }}
               keyboardType="number-pad"
               render={props => (
                  <MaskedTextInput
                     {...props}
                     mask="99.999.999/9999-99"
                     value={empresaForm.cnpj}
                     onChangeText={text => setEmpresaForm(prev => ({ ...prev, cnpj: text }))}
                     keyboardType="number-pad"
                  />
               )}
            />
         </View>

         <View style={styles.switchContainer}>
            <Text variant="bodyLarge">Utiliza Módulo de Eventos?</Text>
            <Switch
               value={empresaForm.UsaModuloEventos}
               onValueChange={(valor) => setEmpresaForm(prev => ({ ...prev, UsaModuloEventos: valor }))}
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
   switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      marginTop: 8,
      paddingHorizontal: 4,
   },
   button: {
      marginTop: 8,
   },
});

export default EmpresaForm;