# Guia de Contribuição - Evolua Ponto Sistema

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)
- [Issues](#issues)

## 🤝 Como Contribuir

Obrigado por considerar contribuir com o Evolua Ponto Sistema! Este guia irá ajudá-lo a entender como contribuir de forma eficaz.

### Tipos de Contribuição

- 🐛 **Bug Fixes**: Correção de bugs existentes
- ✨ **Features**: Implementação de novas funcionalidades
- 📚 **Documentação**: Melhoria da documentação
- 🧪 **Testes**: Adição ou melhoria de testes
- 🎨 **UI/UX**: Melhorias na interface do usuário
- ⚡ **Performance**: Otimizações de performance
- 🔒 **Segurança**: Melhorias de segurança

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+
- .NET 8 SDK
- Docker e Docker Compose
- Git
- Editor de código (VS Code recomendado)

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU-USUARIO/evolua-ponto-sistema.git
cd evolua-ponto-sistema

# Adicionar upstream
git remote add upstream https://github.com/ORIGINAL-REPO/evolua-ponto-sistema.git
```

### 2. Configuração do Backend

```bash
cd backend/EvoluaPonto.Api/EvoluaPonto.Api

# Restaurar dependências
dotnet restore

# Configurar banco de dados
# Copiar appsettings.Development.json e configurar connection string
cp appsettings.json appsettings.Development.json

# Executar migrações
dotnet ef database update
```

### 3. Configuração do Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações
```

### 4. Configuração com Docker

```bash
# Na raiz do projeto
cp .env.example .env
# Editar .env com suas configurações

# Subir os serviços
docker-compose -f docker-compose.dev.yml up -d
```

## 📝 Padrões de Código

### Backend (.NET)

#### Convenções de Nomenclatura

- **Classes**: PascalCase (`RegistroPontoService`)
- **Métodos**: PascalCase (`RegistrarPontoAsync`)
- **Propriedades**: PascalCase (`FuncionarioId`)
- **Variáveis**: camelCase (`funcionarioId`)
- **Constantes**: PascalCase (`MAX_RETRY_ATTEMPTS`)

#### Estrutura de Arquivos

```
Controllers/
├── AuthController.cs
├── FuncionarioController.cs
└── RegistroPontoController.cs

Services/
├── FuncionarioService.cs
├── RegistroPontoService.cs
└── External/
    └── SupabaseAdminService.cs

Models/
├── ModelFuncionario.cs
├── ModelEmpresa.cs
└── Shared/
    └── ServiceResponse.cs
```

#### Exemplo de Controller

```csharp
[ApiController]
[Route("[controller]")]
public class FuncionarioController : ControllerBase
{
    private readonly FuncionarioService _funcionarioService;

    public FuncionarioController(FuncionarioService funcionarioService)
    {
        _funcionarioService = funcionarioService;
    }

    [HttpGet]
    public async Task<IActionResult> GetFuncionarios()
    {
        try
        {
            var funcionarios = await _funcionarioService.GetAllAsync();
            return Ok(funcionarios);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erro interno do servidor", error = ex.Message });
        }
    }
}
```

#### Exemplo de Service

```csharp
public class FuncionarioService
{
    private readonly AppDbContext _context;

    public FuncionarioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponse<List<ModelFuncionario>>> GetAllAsync()
    {
        try
        {
            var funcionarios = await _context.Funcionarios
                .Include(f => f.Estabelecimento)
                .Where(f => f.Ativo)
                .ToListAsync();

            return new ServiceResponse<List<ModelFuncionario>> { Data = funcionarios };
        }
        catch (Exception ex)
        {
            return new ServiceResponse<List<ModelFuncionario>> 
            { 
                Success = false, 
                ErrorMessage = ex.Message 
            };
        }
    }
}
```

### Frontend (React Native/TypeScript)

#### Convenções de Nomenclatura

- **Componentes**: PascalCase (`FuncionarioForm`)
- **Arquivos**: PascalCase (`FuncionarioForm.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useFuncionario`)
- **Variáveis**: camelCase (`funcionarioId`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

#### Estrutura de Componentes

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface FuncionarioFormProps {
  initialData?: ModelFuncionario;
  onSubmit: (data: FuncionarioCreateDto) => Promise<void>;
  isLoading?: boolean;
}

const FuncionarioForm: React.FC<FuncionarioFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<FuncionarioCreateDto>({
    nome: initialData?.nome || '',
    cpf: initialData?.cpf || '',
    // ... outros campos
  });

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Dados do Funcionário</Text>
      {/* Formulário */}
      <Button 
        mode="contained" 
        onPress={handleSubmit}
        loading={isLoading}
      >
        Salvar
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default FuncionarioForm;
```

#### Exemplo de Hook

```typescript
import { useState, useEffect } from 'react';
import api from '../services/api';

interface UseFuncionarioReturn {
  funcionarios: ModelFuncionario[];
  loading: boolean;
  error: string | null;
  createFuncionario: (data: FuncionarioCreateDto) => Promise<void>;
  updateFuncionario: (id: string, data: FuncionarioCreateDto) => Promise<void>;
  deleteFuncionario: (id: string) => Promise<void>;
}

export const useFuncionario = (estabelecimentoId?: string): UseFuncionarioReturn => {
  const [funcionarios, setFuncionarios] = useState<ModelFuncionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFuncionarios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/funcionario', {
        params: { estabelecimentoId }
      });
      setFuncionarios(response.data);
    } catch (err) {
      setError('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, [estabelecimentoId]);

  return {
    funcionarios,
    loading,
    error,
    createFuncionario: async (data) => {
      await api.post('/funcionario', data);
      await fetchFuncionarios();
    },
    updateFuncionario: async (id, data) => {
      await api.put(`/funcionario/${id}`, data);
      await fetchFuncionarios();
    },
    deleteFuncionario: async (id) => {
      await api.delete(`/funcionario/${id}`);
      await fetchFuncionarios();
    }
  };
};
```

## 🔄 Processo de Desenvolvimento

### 1. Criar Branch

```bash
# Atualizar main
git checkout main
git pull upstream main

# Criar nova branch
git checkout -b feature/nova-funcionalidade
# ou
git checkout -b fix/correcao-bug
```

### 2. Desenvolvimento

```bash
# Fazer commits frequentes
git add .
git commit -m "feat: adicionar validação de CPF"

# Push para seu fork
git push origin feature/nova-funcionalidade
```

### 3. Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(escopo): descrição

Corpo do commit (opcional)

Rodapé (opcional)
```

**Tipos:**

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, sem mudança de código
- `refactor`: Refatoração de código
- `test`: Adição de testes
- `chore`: Tarefas de manutenção

**Exemplos:**

```bash
git commit -m "feat(auth): adicionar refresh token automático"
git commit -m "fix(ponto): corrigir validação de horário"
git commit -m "docs(api): atualizar documentação dos endpoints"
git commit -m "refactor(services): extrair lógica de validação"
```

## 🧪 Testes

### Backend

```bash
# Executar todos os testes
dotnet test

# Executar testes com cobertura
dotnet test --collect:"XPlat Code Coverage"

# Executar testes específicos
dotnet test --filter "ClassName=FuncionarioServiceTest"
```

### Frontend

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

### Testes de Integração

```bash
# Com Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📚 Documentação

### Atualizar Documentação

- **README.md**: Atualizar para mudanças significativas
- **API Documentation**: Atualizar para novos endpoints
- **Frontend Documentation**: Atualizar para novos componentes
- **Database Schema**: Atualizar para mudanças no banco

### Comentários no Código

```csharp
/// <summary>
/// Registra um ponto para o funcionário especificado
/// </summary>
/// <param name="pontoDto">Dados do registro de ponto</param>
/// <param name="funcionarioId">ID do funcionário</param>
/// <returns>Resposta do serviço com o registro criado</returns>
public async Task<ServiceResponse<ModelRegistroPonto>> RegistrarPontoAsync(
    RegistroPontoDto pontoDto, 
    Guid funcionarioId)
{
    // Implementação...
}
```

```typescript
/**
 * Hook para gerenciar funcionários de um estabelecimento
 * @param estabelecimentoId - ID do estabelecimento (opcional)
 * @returns Objeto com estado e funções para gerenciar funcionários
 */
export const useFuncionario = (estabelecimentoId?: string): UseFuncionarioReturn => {
  // Implementação...
};
```

## 🔀 Pull Requests

### Antes de Criar um PR

1. ✅ Código segue os padrões estabelecidos
2. ✅ Testes passam
3. ✅ Documentação atualizada
4. ✅ Commits seguem convenções
5. ✅ Branch atualizada com main

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças realizadas.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Testes adicionados/atualizados
- [ ] Não há breaking changes

## Screenshots (se aplicável)
Adicionar screenshots para mudanças de UI.

## Issues Relacionadas
Closes #123
```

### Processo de Review

1. **Automático**: CI/CD executa testes
2. **Review**: Pelo menos 1 aprovação necessária
3. **Merge**: Após aprovação e testes passando

## 🐛 Issues

### Criando Issues

Use os templates disponíveis:

- 🐛 **Bug Report**
- ✨ **Feature Request**
- 📚 **Documentation**
- ❓ **Question**

### Labels

- `bug`: Algo não está funcionando
- `enhancement`: Nova funcionalidade
- `documentation`: Melhorias na documentação
- `good first issue`: Bom para iniciantes
- `help wanted`: Precisa de ajuda
- `priority: high`: Alta prioridade
- `priority: medium`: Média prioridade
- `priority: low`: Baixa prioridade

## 🏷️ Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Nova funcionalidade compatível
- **PATCH**: Correções compatíveis

## 📞 Suporte

### Canais de Comunicação

- 💬 **Discord**: [Link do servidor]
- 📧 **Email**: <dev@evolua.com>
- 📋 **Issues**: GitHub Issues
- 📖 **Wiki**: [Link da wiki]

### Perguntas Frequentes

**Q: Como posso começar a contribuir?**
A: Comece com issues marcadas como `good first issue` ou `help wanted`.

**Q: Preciso de permissão para contribuir?**
A: Não! Qualquer um pode contribuir. Fork, faça suas mudanças e abra um PR.

**Q: Como reportar um bug?**
A: Use o template de Bug Report nas Issues, incluindo passos para reproduzir.

**Q: Posso trabalhar em features grandes?**
A: Sim! Mas recomenda-se discutir primeiro em uma Issue para alinhar expectativas.

---

Obrigado por contribuir com o Evolua Ponto Sistema! 🚀
