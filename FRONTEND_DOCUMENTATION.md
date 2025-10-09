# Documentação do Frontend - Evolua Ponto Sistema

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Componentes](#componentes)
- [Navegação](#navegação)
- [Contextos](#contextos)
- [Hooks](#hooks)
- [Serviços](#serviços)
- [Temas](#temas)
- [Desenvolvimento](#desenvolvimento)

## 🎯 Visão Geral

O frontend do Evolua Ponto Sistema é uma aplicação React Native desenvolvida com Expo, oferecendo uma experiência nativa tanto em dispositivos móveis quanto em web. A aplicação utiliza Expo Router para navegação baseada em arquivos e React Native Paper para componentes de UI.

### Tecnologias Principais

- **React Native** 0.79.6
- **Expo** ~53.0.22
- **Expo Router** ~5.1.5
- **React Native Paper** 5.14.5
- **TypeScript** ~5.8.3
- **React Native Maps** 1.26.14

## 🏗️ Arquitetura

### Padrões Utilizados

- **File-based Routing** com Expo Router
- **Context API** para gerenciamento de estado global
- **Custom Hooks** para lógica reutilizável
- **Service Layer** para comunicação com API
- **Component Composition** para reutilização

### Fluxo de Dados

```
User Interaction → Component → Hook/Context → Service → API
                     ↓
                State Update → UI Re-render
```

## 📁 Estrutura de Pastas

```
frontend/
├── app/                          # Páginas (Expo Router)
│   ├── (auth)/                   # Grupo de autenticação
│   │   └── login.tsx            # Tela de login
│   ├── (employee)/               # Grupo do funcionário
│   │   ├── _layout.tsx          # Layout do funcionário
│   │   └── home.tsx             # Home do funcionário
│   ├── (admin)/                  # Grupo do admin
│   │   ├── _layout.tsx          # Layout do admin
│   │   ├── estabelecimentos/    # Gestão de estabelecimentos
│   │   └── relatorios.tsx       # Relatórios
│   ├── (superadmin)/             # Grupo do super admin
│   │   ├── _layout.tsx          # Layout do super admin
│   │   ├── empresas/            # Gestão de empresas
│   │   ├── estabelecimentos/    # Gestão de estabelecimentos
│   │   └── funcionarios/        # Gestão de funcionários
│   ├── _layout.tsx              # Layout raiz
│   ├── index.tsx                # Página inicial
│   ├── modal.tsx                # Modal global
│   └── +not-found.tsx           # Página 404
├── components/                   # Componentes reutilizáveis
│   ├── forms/                   # Formulários
│   ├── layouts/                 # Layouts
│   ├── lists/                   # Listas
│   ├── navigation/              # Componentes de navegação
│   └── CustomLoader.tsx         # Loader customizado
├── contexts/                    # Contextos React
│   ├── AuthContext.tsx          # Contexto de autenticação
│   └── NotificationContext.tsx  # Contexto de notificações
├── hooks/                       # Custom hooks
│   ├── admin/                   # Hooks específicos do admin
│   └── superadmin/              # Hooks específicos do super admin
├── models/                      # Interfaces TypeScript
├── services/                    # Serviços de API
└── constants/                   # Constantes
```

## 🧩 Componentes

### Componentes de Layout

#### ScreenContainer

Wrapper padrão para todas as telas com padding e alinhamento.

```typescript
import ScreenContainer from '../components/layouts/ScreenContainer';

<ScreenContainer>
  <Text>Conteúdo da tela</Text>
</ScreenContainer>
```

#### FieldSet

Componente para agrupar campos de formulário.

```typescript
import FieldSet from '../components/layouts/FieldSet';

<FieldSet title="Dados Pessoais">
  <TextInput label="Nome" />
  <TextInput label="CPF" />
</FieldSet>
```

### Componentes de Formulário

#### EmpresaForm

Formulário para criação/edição de empresas.

```typescript
import EmpresaForm from '../components/forms/EmpresaForm';

<EmpresaForm
  initialData={empresa}
  onSubmit={handleSubmit}
  isLoading={loading}
/>
```

#### FuncionarioForm

Formulário para criação/edição de funcionários.

```typescript
import FuncionarioForm from '../components/forms/FuncionarioForm';

<FuncionarioForm
  estabelecimentos={estabelecimentos}
  onSubmit={handleSubmit}
  isLoading={loading}
/>
```

### Componentes de Lista

#### ListEstabelecimentos

Lista de estabelecimentos com ações.

```typescript
import ListEstabelecimentos from '../components/lists/listEstabelecimentos';

<ListEstabelecimentos
  estabelecimentos={estabelecimentos}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Componentes de Navegação

#### CustomDrawerContent

Conteúdo customizado do drawer navigation.

```typescript
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';

<Drawer.Navigator drawerContent={CustomDrawerContent}>
  {/* Rotas */}
</Drawer.Navigator>
```

#### CustomHeader

Header customizado com ações.

```typescript
import CustomHeader from '../components/navigation/CustomHeader';

<CustomHeader
  title="Título"
  onMenuPress={handleMenu}
  actions={[
    { icon: 'plus', onPress: handleAdd }
  ]}
/>
```

## 🧭 Navegação

### Estrutura de Rotas

O sistema utiliza Expo Router com roteamento baseado em arquivos:

```
app/
├── (auth)/          # Rotas de autenticação
│   └── login.tsx
├── (employee)/      # Rotas do funcionário
│   └── home.tsx
├── (admin)/         # Rotas do admin
│   ├── estabelecimentos/
│   └── relatorios.tsx
└── (superadmin)/    # Rotas do super admin
    ├── empresas/
    ├── estabelecimentos/
    └── funcionarios/
```

### Navegação Programática

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navegar para uma rota
router.push('/empresas');

// Navegar e substituir histórico
router.replace('/login');

// Voltar
router.back();
```

### Layouts Aninhados

Cada grupo de rotas possui seu próprio layout:

```typescript
// app/(admin)/_layout.tsx
export default function AdminLayout() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="estabelecimentos" component={EstabelecimentosScreen} />
      <Drawer.Screen name="relatorios" component={RelatoriosScreen} />
    </Drawer.Navigator>
  );
}
```

## 🎭 Contextos

### AuthContext

Gerencia autenticação e estado do usuário.

```typescript
import { useAuth } from '../contexts/AuthContext';

const { 
  isAuthenticated, 
  role, 
  userId, 
  signIn, 
  signOut,
  theme,
  toggleTheme 
} = useAuth();
```

**Propriedades:**

- `isAuthenticated`: boolean - Se o usuário está autenticado
- `role`: 'superadmin' | 'admin' | 'normal' | null - Papel do usuário
- `userId`: string | null - ID do usuário
- `signIn(email, password)`: Promise<void> - Função de login
- `signOut()`: void - Função de logout
- `theme`: 'light' | 'dark' - Tema atual
- `toggleTheme()`: void - Alternar tema

### NotificationContext

Gerencia notificações globais.

```typescript
import { useNotification } from '../contexts/NotificationContext';

const { showNotification } = useNotification();

showNotification('Sucesso!', 'success');
showNotification('Erro!', 'error');
```

## 🪝 Hooks

### Hooks de Admin

#### useEstabelecimento

Hook para gerenciar estabelecimentos.

```typescript
import { useEstabelecimento } from '../hooks/admin/useEstabelecimento';

const {
  estabelecimentos,
  loading,
  error,
  createEstabelecimento,
  updateEstabelecimento,
  deleteEstabelecimento
} = useEstabelecimento(empresaId);
```

### Hooks de Super Admin

#### useEmpresa

Hook para gerenciar empresas.

```typescript
import { useEmpresa } from '../hooks/superadmin/useEmpresa';

const {
  empresas,
  loading,
  error,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa
} = useEmpresa();
```

#### useFuncionario

Hook para gerenciar funcionários.

```typescript
import { useFuncionario } from '../hooks/superadmin/useFuncionario';

const {
  funcionarios,
  loading,
  error,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario
} = useFuncionario(estabelecimentoId);
```

## 🔧 Serviços

### API Service

Serviço principal para comunicação com a API.

```typescript
import api from '../services/api';

// GET request
const response = await api.get('/funcionario');

// POST request
const response = await api.post('/funcionario', data);

// PUT request
const response = await api.put(`/funcionario/${id}`, data);

// DELETE request
const response = await api.delete(`/funcionario/${id}`);
```

### Storage Service

Serviço para armazenamento local.

```typescript
import { saveAuthData, loadAuthData, clearAuthData } from '../services/storage';

// Salvar dados de autenticação
await saveAuthData({
  token: 'jwt-token',
  refreshToken: 'refresh-token',
  role: 'admin',
  id: 'user-id'
});

// Carregar dados de autenticação
const authData = await loadAuthData();

// Limpar dados de autenticação
await clearAuthData();
```

## 🎨 Temas

### Sistema de Temas

A aplicação suporta temas claro e escuro usando React Native Paper.

```typescript
import { useAuth } from '../contexts/AuthContext';

const { theme, toggleTheme } = useAuth();

// theme pode ser 'light' ou 'dark'
```

### Cores Personalizadas

```typescript
// constants/Colors.ts
export const Colors = {
  light: {
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
  },
  dark: {
    primary: '#bb86fc',
    secondary: '#03dac6',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
  },
};
```

## 📱 Funcionalidades por Tipo de Usuário

### Funcionário (normal)

- **Home**: Visualização de localização em tempo real
- **Registro de Ponto**: Botão para registrar entrada/saída
- **Espelho de Ponto**: Visualização de registros mensais

### Admin

- **Estabelecimentos**: Gestão de estabelecimentos da empresa
- **Relatórios**: Geração de AFD e AEJ
- **Funcionários**: Visualização de funcionários do estabelecimento

### Super Admin

- **Empresas**: Gestão completa de empresas
- **Estabelecimentos**: Gestão de todos os estabelecimentos
- **Funcionários**: Gestão completa de funcionários
- **Relatórios**: Acesso a todos os relatórios

## 🚀 Desenvolvimento

### Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios

# Executar na web
npm run web

# Executar testes
npm test
```

### Estrutura de uma Tela

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import ScreenContainer from '../../components/layouts/ScreenContainer';

const MinhaTela = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      // Lógica da ação
    } catch (error) {
      // Tratamento de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text variant="headlineLarge">Minha Tela</Text>
      <Button 
        mode="contained" 
        onPress={handleAction}
        loading={loading}
      >
        Ação
      </Button>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default MinhaTela;
```

### Boas Práticas

1. **Componentes**: Sempre use TypeScript e defina interfaces
2. **Estados**: Use useState para estado local, Context para estado global
3. **Loading**: Sempre mostre indicadores de carregamento
4. **Erros**: Trate erros adequadamente e mostre feedback ao usuário
5. **Navegação**: Use Expo Router para navegação
6. **Temas**: Respeite o tema atual da aplicação
7. **Responsividade**: Teste em diferentes tamanhos de tela

### Debugging

```bash
# Logs do Expo
npx expo logs

# Debug no Chrome
# Pressione 'j' no terminal do Expo para abrir debugger

# Inspecionar elementos
# Pressione 'i' no terminal do Expo para abrir inspector
```

## 📦 Build e Deploy

### Build para Produção

```bash
# Build para Android
npx expo build:android

# Build para iOS
npx expo build:ios

# Build para Web
npx expo build:web
```

### Configuração de Ambiente

```typescript
// app.config.js
export default {
  expo: {
    name: "Evolua Ponto",
    slug: "evolua-ponto-sistema",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    web: {
      favicon: "./assets/images/favicon.png"
    }
  }
};
```

---

Para mais informações sobre desenvolvimento, consulte a [documentação do Expo](https://docs.expo.dev/) e [React Native Paper](https://reactnativepaper.com/).
