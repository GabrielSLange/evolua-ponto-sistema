# Documentação da API Backend - Evolua Ponto Sistema

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
- [Modelos de Dados](#modelos-de-dados)
- [Códigos de Status](#códigos-de-status)
- [Exemplos de Uso](#exemplos-de-uso)

## 🎯 Visão Geral

A API do Evolua Ponto Sistema é construída com ASP.NET Core 8 e oferece endpoints RESTful para gerenciamento completo de controle de ponto eletrônico. A API utiliza autenticação JWT e integra com Supabase para autenticação e armazenamento.

### Base URL

- **Desenvolvimento**: `http://localhost:5000/api`
- **Produção**: `https://sua-api.com/api`

### Tecnologias

- ASP.NET Core 8 Web API
- Entity Framework Core
- PostgreSQL
- JWT Bearer Authentication
- Swagger/OpenAPI
- Supabase Integration

## 🔐 Autenticação

A API utiliza autenticação JWT Bearer Token. Todos os endpoints protegidos requerem o header `Authorization` com o token JWT.

### Header de Autenticação

```
Authorization: Bearer <seu-jwt-token>
```

### Fluxo de Autenticação

1. **Login**: `POST /auth/login`
2. **Receber token**: Resposta contém `access_token` e `refresh_token`
3. **Usar token**: Incluir no header `Authorization` para requests autenticados
4. **Renovar token**: `POST /auth/refresh-token` quando necessário

## 📡 Endpoints

### 🔑 Autenticação

#### POST /auth/login

Autentica um usuário no sistema.

**Request Body:**

```json
{
  "email": "usuario@empresa.com",
  "password": "senha123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@empresa.com"
  }
}
```

#### POST /auth/refresh-token

Renova o token de acesso usando o refresh token.

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 👥 Funcionários

#### GET /funcionario

Lista todos os funcionários (requer autenticação).

**Query Parameters:**

- `estabelecimentoId` (opcional): Filtrar por estabelecimento
- `ativo` (opcional): Filtrar por status ativo (true/false)

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "cpf": "12345678901",
    "cargo": "Desenvolvedor",
    "horarioContratual": "08:00-17:00",
    "ativo": true,
    "estabelecimentoId": "uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /funcionario

Cria um novo funcionário.

**Request Body:**

```json
{
  "nome": "João Silva",
  "cpf": "12345678901",
  "email": "joao@empresa.com",
  "password": "senha123",
  "cargo": "Desenvolvedor",
  "estabelecimentoId": "uuid",
  "role": "normal"
}
```

#### PUT /funcionario/{id}

Atualiza um funcionário existente.

#### DELETE /funcionario/{id}

Desativa um funcionário (soft delete).

### 🏢 Empresas

#### GET /empresas

Lista todas as empresas (requer role superadmin).

#### POST /empresas

Cria uma nova empresa.

**Request Body:**

```json
{
  "razaoSocial": "Empresa Exemplo LTDA",
  "cnpj": "12345678000195",
  "endereco": "Rua Exemplo, 123",
  "telefone": "(11) 99999-9999"
}
```

### 🏪 Estabelecimentos

#### GET /estabelecimento

Lista estabelecimentos (filtrado por empresa do usuário).

#### POST /estabelecimento

Cria um novo estabelecimento.

**Request Body:**

```json
{
  "nome": "Matriz",
  "endereco": "Rua Principal, 456",
  "empresaId": "uuid"
}
```

### ⏰ Registro de Ponto

#### POST /registro-ponto

Registra um ponto para o funcionário autenticado.

**Request Body:**

```json
{
  "tipo": "entrada",
  "foto": "base64-string-opcional"
}
```

**Tipos de ponto:**

- `entrada` - Entrada no trabalho
- `saida` - Saída do trabalho
- `entrada_almoco` - Entrada do almoço
- `saida_almoco` - Saída do almoço

**Response (200 OK):**

```json
{
  "id": "uuid",
  "funcionarioId": "uuid",
  "timestampMarcacao": "2024-01-01T08:00:00Z",
  "tipo": "entrada",
  "fotoUrl": "https://storage.url/foto.jpg",
  "comprovanteUrl": "https://storage.url/comprovante.pdf",
  "nsr": 1,
  "hashSha256": "abc123...",
  "geolocalizacaoIp": "192.168.1.1"
}
```

#### GET /registro-ponto/espelho/{funcionarioId}

Gera o espelho de ponto mensal para um funcionário.

**Query Parameters:**

- `ano` (obrigatório): Ano do espelho
- `mes` (obrigatório): Mês do espelho (1-12)

**Response (200 OK):**

```json
{
  "funcionario": {
    "nome": "João Silva",
    "cpf": "12345678901"
  },
  "periodo": {
    "ano": 2024,
    "mes": 1
  },
  "registros": [
    {
      "data": "2024-01-01",
      "entrada": "08:00",
      "saidaAlmoco": "12:00",
      "entradaAlmoco": "13:00",
      "saida": "17:00",
      "totalHoras": "08:00"
    }
  ],
  "totais": {
    "horasTrabalhadas": "160:00",
    "horasExtras": "00:00",
    "diasTrabalhados": 20
  }
}
```

### 📊 Relatórios

#### GET /relatorios/afd/{estabelecimentoId}

Gera arquivo AFD (Arquivo de Fonte de Dados) para um estabelecimento.

**Query Parameters:**

- `dataInicio` (obrigatório): Data de início (YYYY-MM-DD)
- `dataFim` (obrigatório): Data de fim (YYYY-MM-DD)

**Response (200 OK):**
Retorna arquivo de texto no formato AFD conforme Portaria 671.

#### GET /relatorios/aej/{estabelecimentoId}

Gera arquivo AEJ (Arquivo Eletrônico de Jornada) para um estabelecimento.

**Query Parameters:**

- `dataInicio` (obrigatório): Data de início (YYYY-MM-DD)
- `dataFim` (obrigatório): Data de fim (YYYY-MM-DD)

**Response (200 OK):**
Retorna arquivo de texto no formato AEJ conforme eSocial.

### 🎉 Feriados

#### GET /feriados

Lista feriados nacionais e personalizados.

#### POST /feriados/personalizado

Cria um feriado personalizado para a empresa.

**Request Body:**

```json
{
  "nome": "Dia da Empresa",
  "data": "2024-06-15",
  "empresaId": "uuid"
}
```

## 📊 Modelos de Dados

### Funcionario

```json
{
  "id": "uuid",
  "nome": "string",
  "cpf": "string",
  "cargo": "string",
  "horarioContratual": "string",
  "ativo": "boolean",
  "estabelecimentoId": "uuid",
  "createdAt": "datetime"
}
```

### Empresa

```json
{
  "id": "uuid",
  "razaoSocial": "string",
  "cnpj": "string",
  "endereco": "string",
  "telefone": "string",
  "createdAt": "datetime"
}
```

### Estabelecimento

```json
{
  "id": "uuid",
  "nome": "string",
  "endereco": "string",
  "empresaId": "uuid",
  "createdAt": "datetime"
}
```

### RegistroPonto

```json
{
  "id": "uuid",
  "funcionarioId": "uuid",
  "timestampMarcacao": "datetime",
  "tipo": "string",
  "fotoUrl": "string",
  "comprovanteUrl": "string",
  "nsr": "long",
  "hashSha256": "string",
  "geolocalizacaoIp": "string",
  "createdAt": "datetime"
}
```

## 📋 Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro interno |

## 💡 Exemplos de Uso

### Exemplo 1: Login e Registro de Ponto

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'funcionario@empresa.com',
    password: 'senha123'
  })
});

const { access_token } = await loginResponse.json();

// 2. Registrar ponto
const pontoResponse = await fetch('/api/registro-ponto', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    tipo: 'entrada'
  })
});

const ponto = await pontoResponse.json();
console.log('Ponto registrado:', ponto);
```

### Exemplo 2: Gerar Espelho de Ponto

```javascript
const espelhoResponse = await fetch('/api/registro-ponto/espelho/uuid-funcionario?ano=2024&mes=1', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const espelho = await espelhoResponse.json();
console.log('Espelho de ponto:', espelho);
```

### Exemplo 3: Gerar Relatório AFD

```javascript
const afdResponse = await fetch('/api/relatorios/afd/uuid-estabelecimento?dataInicio=2024-01-01&dataFim=2024-01-31', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const afdContent = await afdResponse.text();
console.log('Conteúdo AFD:', afdContent);
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
ConnectionStrings__DefaultConnection=Host=localhost;Database=evolua_ponto;Username=postgres;Password=senha

# JWT
Jwt__Secret=sua_chave_secreta_jwt
Jwt__Audience=evolua-ponto-api
Jwt__Issuer=evolua-ponto-system

# Supabase
Supabase__Url=https://seu-projeto.supabase.co
Supabase__ServiceRoleKey=sua_service_role_key
```

### CORS

A API está configurada para aceitar requests dos seguintes origins:

- `http://localhost:8081` (Expo)
- `http://localhost:8080` (Web)
- `https://evolua-ponto-sistema.vercel.app` (Produção)

## 📝 Notas Importantes

1. **NSR (Número Sequencial do Rep)**: Cada registro de ponto recebe um NSR único por empresa, conforme legislação.

2. **Hash SHA-256**: Cada registro é assinado com hash SHA-256 para garantir integridade.

3. **Comprovantes**: PDFs são gerados automaticamente e assinados digitalmente.

4. **Geolocalização**: Sistema captura IP e permite foto opcional para maior segurança.

5. **Conformidade Legal**: AFD e AEJ seguem padrões oficiais do governo brasileiro.

---

Para mais informações, consulte a documentação do Swagger em `/api/swagger` quando a API estiver rodando.
