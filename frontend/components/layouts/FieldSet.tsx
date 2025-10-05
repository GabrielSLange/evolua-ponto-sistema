import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FieldsetProps {
   legend: string;
   children: React.ReactNode;
}

export const Fieldset: React.FC<FieldsetProps> = ({ legend, children }) => {
   return (
      <View style={styles.container}>
         <Text style={styles.legend}>{legend}</Text>
         <View style={styles.content}>{children}</View>
      </View>
   );
};

const styles = StyleSheet.create({
   container: {
      borderWidth: 1,
      borderColor: '#aaa',
      borderRadius: 8,
      padding: 10,
      marginBottom: 16,
   },
   legend: {
      position: 'absolute',
      top: -10,
      left: 12,
      backgroundColor: '#fff',
      paddingHorizontal: 6,
      fontWeight: '600',
      color: '#333',
   },
   content: {
      marginTop: 10,
   },
});
