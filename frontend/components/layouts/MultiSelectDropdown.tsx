import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  TextInput, 
  Modal, 
  Portal, 
  Text, 
  Checkbox, 
  Button, 
  Searchbar, 
  Divider, 
  useTheme 
} from 'react-native-paper';

// 1. Definimos o formato do objeto Item
export interface DropdownItem {
  id: string;
  nome: string;
}

// 2. Definimos os tipos das propriedades (Props) do componente
interface MultiSelectDropdownProps {
  label: string;
  items: DropdownItem[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  placeholder?: string;
}

export const MultiSelectDropdown = ({ 
  label, 
  items, 
  selectedIds, 
  onSave, 
  placeholder = "Selecione..."
}: MultiSelectDropdownProps) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tipamos o estado como array de strings
  const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);

  const showModal = () => {
    setTempSelected(selectedIds);
    setSearchQuery('');
    setVisible(true);
  };

  const hideModal = () => setVisible(false);

  const filteredItems = useMemo(() => {
    return items.filter((item: DropdownItem) => 
      item.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Lógica "Selecionar Todos"
  const isAllSelected = filteredItems.length > 0 && filteredItems.every((item: DropdownItem) => tempSelected.includes(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Desmarcar todos os visíveis
      const visibleIds = filteredItems.map((i: DropdownItem) => i.id);
      setTempSelected((prev: string[]) => prev.filter((id: string) => !visibleIds.includes(id)));
    } else {
      // Marcar todos os visíveis
      const visibleIds = filteredItems.map((i: DropdownItem) => i.id);
      setTempSelected((prev: string[]) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleItem = (id: string) => {
    if (tempSelected.includes(id)) {
      setTempSelected((prev: string[]) => prev.filter((item: string) => item !== id));
    } else {
      setTempSelected((prev: string[]) => [...prev, id]);
    }
  };

  const handleConfirm = () => {
    onSave(tempSelected);
    hideModal();
  };

  const displayText = useMemo(() => {
    if (selectedIds.length === 0) return '';
    if (selectedIds.length === items.length && items.length > 0) return 'Todos Selecionados';
    if (selectedIds.length === 1) {
        const item = items.find((i: DropdownItem) => i.id === selectedIds[0]);
        return item ? item.nome : '';
    }
    return `${selectedIds.length} funcionários selecionados`;
  }, [selectedIds, items]);

  return (
    <>
      <TouchableOpacity onPress={showModal}>
        <TextInput
          label={label}
          value={displayText}
          placeholder={placeholder}
          editable={false}
          right={<TextInput.Icon icon="chevron-down" onPress={showModal} forceTextInputFocus={false} />}
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface }}
        />
      </TouchableOpacity>

      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold' }}>Selecione os Funcionários</Text>
          
          <Searchbar
            placeholder="Buscar nome..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{ marginBottom: 12 }}
          />

          <TouchableOpacity onPress={toggleSelectAll} style={styles.checkRow}>
             <Checkbox.Android status={isAllSelected ? 'checked' : 'unchecked'} />
             <Text style={{ fontWeight: 'bold' }}>Selecionar Todos (Filtrados)</Text>
          </TouchableOpacity>
          <Divider />

          <ScrollView style={{ maxHeight: 300 }}>
            {filteredItems.map((item: DropdownItem) => (
              <TouchableOpacity key={item.id} onPress={() => toggleItem(item.id)} style={styles.checkRow}>
                <Checkbox.Android status={tempSelected.includes(item.id) ? 'checked' : 'unchecked'} />
                <Text>{item.nome}</Text>
              </TouchableOpacity>
            ))}
            {filteredItems.length === 0 && (
                <Text style={{ textAlign: 'center', margin: 20, color: '#999' }}>Nenhum funcionário encontrado.</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
             <Button onPress={hideModal} style={{ marginRight: 10 }}>Cancelar</Button>
             <Button mode="contained" onPress={handleConfirm}>Confirmar</Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  }
});