import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ListRenderItemInfo, useWindowDimensions } from 'react-native';
import { Text, TextInput, Portal, Modal, List, IconButton, useTheme } from 'react-native-paper';

interface SearchableDropdownProps {
   label: string;
   value?: string;
   onSelect: (value: string) => void;
   options: string[];             // lista de strings
   placeholder?: string;
   textoVazio?: string;      // opcional, texto a mostrar quando não houver opções
   visible?: boolean;             // opcional, se quiser controlar externamente
   style?: object;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
   label,
   value,
   onSelect,
   options,
   placeholder = 'Pesquisar...',
   textoVazio = 'Nenhum resultado',
   style,
}) => {
   const [open, setOpen] = useState(false);
   const [query, setQuery] = useState('');
   const theme = useTheme();
   const { width } = useWindowDimensions();
   const isDesktop = width > 768;


   // Filtra opções (case-insensitive)
   const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter(opt => opt.toLowerCase().includes(q));
   }, [options, query]);

   const handleChoose = (item: string) => {
      onSelect(item);
      setOpen(false);
      setQuery('');
   };

   const renderItem = ({ item }: ListRenderItemInfo<string>) => (
      <List.Item
         title={item}
         onPress={() => handleChoose(item)}
         titleNumberOfLines={1}
      />
   );

   return (
      <View style={[style, { backgroundColor: theme.colors.background }]}>
         <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.7}>
            <TextInput
               label={label}
               value={value ?? ''}
               pointerEvents="none"
               editable={false}
               right={<TextInput.Icon icon="menu-down" />}
            />
         </TouchableOpacity>

         <Portal>
            <Modal
               visible={open}
               onDismiss={() => { setOpen(false); setQuery(''); }}
               contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background, maxWidth: isDesktop ? '20%' : '80%' }]}
            >
               <View style={styles.header}>
                  <Text style={styles.title}>{label}</Text>
                  <IconButton icon="close" onPress={() => { setOpen(false); setQuery(''); }} />
               </View>

               <TextInput
                  placeholder={placeholder}
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
               />

               <FlatList
                  data={filtered}
                  keyExtractor={(item) => item}
                  renderItem={renderItem}
                  keyboardShouldPersistTaps="handled"
                  style={styles.list}
                  ListEmptyComponent={<Text style={styles.emptyText}>{textoVazio}</Text>}
                  showsVerticalScrollIndicator={false}
               />
            </Modal>
         </Portal>
      </View>
   );
};

const styles = StyleSheet.create({
   modalContainer: {
      position: 'absolute',
      // Centraliza no meio da tela
      alignSelf: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      backgroundColor: 'white',
      borderRadius: 8,
      maxHeight: '50%',
      paddingBottom: 8,
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderBottomWidth: 1,
   },
   title: {
      fontWeight: '700',
      fontSize: 18
   },
   searchInput: {
      marginHorizontal: 12,
      marginTop: 8,
      marginBottom: 6
   },
   list: {
      paddingHorizontal: 4
   },
   emptyText: {
      padding: 16,
      textAlign: 'center',
   }
});
