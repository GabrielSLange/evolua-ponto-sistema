# Evolua Ponto Sistema

Sistema completo de controle de ponto eletrônico desenvolvido com tecnologias modernas, oferecendo funcionalidades avançadas de registro de ponto, geração de relatórios e conformidade com a legislação trabalhista brasileira.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
- [Uso](#uso)
- [API Documentation](#api-documentation)
- [Deploy](#deploy)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🎯 Visão Geral

O **Evolua Ponto Sistema** é uma solução completa para controle de ponto eletrônico que atende às necessidades de empresas de diferentes portes. O sistema oferece:

- **Registro de ponto com geolocalização** em tempo real
- **Geração automática de comprovantes** assinados digitalmente
- **Relatórios AFD e AEJ** para conformidade legal
- **Interface responsiva** para web e mobile
- **Sistema de permissões** com três níveis de acesso
- **Integração com Supabase** para autenticação e armazenamento

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização

- Login seguro com JWT
- Três níveis de usuário: Super Admin, Admin e Funcionário
- Refresh token automático
- Tema claro/escuro

### 📍 Registro de Ponto

- Geolocalização em tempo real
- Captura de foto opcional
- Geração de hash SHA-256 para integridade
- Comprovante PDF assinado digitalmente
- Numeração sequencial (NSR) por empresa

### 📊 Relatórios e Conformidade

- **AFD (Arquivo de Fonte de Dados)** - Portaria 671
- **AEJ (Arquivo Eletrônico de Jornada)** - eSocial
- Espelho de ponto mensal
- Relatórios personalizados

### 🏢 Gestão Empresarial

- Cadastro de empresas
- Gestão de estabelecimentos
- Cadastro de funcionários
- Configuração de feriados personalizados

## 🏗️ Arquitetura

O sistema segue uma arquitetura de microserviços com separação clara entre frontend e backend:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React Native)│◄──►│   (.NET 8 API)  │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Nginx         │    │   PgAdmin       │
│  (Auth/Storage) │    │  (Reverse Proxy)│    │   (DB Admin)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes Principais

- **Frontend**: React Native com Expo Router
- **Backend**: ASP.NET Core 8 Web API
- **Database**: PostgreSQL 15
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Proxy**: Nginx
- **Containerização**: Docker & Docker Compose

## 🛠️ Tecnologias

### Frontend

- **React Native** 0.79.6
- **Expo** ~53.0.22
- **Expo Router** ~5.1.5
- **React Native Paper** 5.14.5
- **React Native Maps** 1.26.14
- **Axios** 1.11.0
- **TypeScript** ~5.8.3

### Backend

- **.NET 8**
- **ASP.NET Core Web API**
- **Entity Framework Core** 8.0.11
- **PostgreSQL** (Npgsql)
- **JWT Bearer Authentication**
- **Swagger/OpenAPI** 6.6.2
- **QuestPDF** 2025.7.0
- **BouncyCastle** 2.6.2

### Infraestrutura

- **Docker** & **Docker Compose**
- **PostgreSQL** 15-alpine
- **Nginx** stable-alpine
- **PgAdmin** 4

## 📁 Estrutura do Projeto

```
evolua-ponto-sistema/
├── backend/
│   └── EvoluaPonto.Api/
│       ├── Controllers/          # Controladores da API
│       ├── Data/                 # Contexto do Entity Framework
│       ├── Dtos/                 # Data Transfer Objects
│       ├── Models/               # Modelos de dados
│       ├── Services/             # Lógica de negócio
│       └── Program.cs            # Configuração da aplicação
├── frontend/
│   ├── app/                      # Páginas (Expo Router)
│   ├── components/               # Componentes reutilizáveis
│   ├── contexts/                 # Contextos React
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # Serviços de API
│   └── models/                   # Interfaces TypeScript
├── nginx/                        # Configuração do Nginx
├── docker-compose.yml            # Orquestração dos containers
└── README.md                     # Este arquivo
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- .NET 8 SDK (para desenvolvimento local)

### 1. Clone o repositório

```bash
git clone <repository-url>
cd evolua-ponto-sistema
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
POSTGRES_DB=evolua_ponto
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_segura

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta
JWT_AUDIENCE=evolua-ponto-api
JWT_ISSUER=evolua-ponto-system

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_service_role_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# PgAdmin
PGADMIN_EMAIL=admin@evolua.com
PGADMIN_PASSWORD=admin123
```

### 3. Execute com Docker Compose

```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Produção
docker-compose up -d
```

### 4. Acesse os serviços

- **Frontend**: <http://localhost:80>
- **Backend API**: <http://localhost:5000/api>
- **Swagger**: <http://localhost:5000/api/swagger>
- **PgAdmin**: <http://localhost:5050>

## 💻 Desenvolvimento Local

### Backend

```bash
cd backend/EvoluaPonto.Api/EvoluaPonto.Api
dotnet restore
dotnet run
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 📖 Uso

### Tipos de Usuário

1. **Super Admin**: Acesso total ao sistema
   - Gerencia empresas
   - Cria estabelecimentos
   - Cadastra funcionários

2. **Admin**: Gerencia estabelecimento específico
   - Visualiza funcionários do estabelecimento
   - Gera relatórios
   - Configura feriados

3. **Funcionário**: Usuário final
   - Registra ponto
   - Visualiza espelho de ponto
   - Acessa comprovantes

### Fluxo Principal

1. **Login** com email e senha
2. **Registro de ponto** com geolocalização
3. **Geração automática** de comprovante assinado
4. **Visualização** de relatórios e espelhos

## 📚 API Documentation

A documentação completa da API está disponível via Swagger em:

- **Desenvolvimento**: <http://localhost:5000/api/swagger>
- **Produção**: <https://sua-api.com/api/swagger>

### Endpoints Principais

#### Autenticação

- `POST /auth/login` - Login do usuário
- `POST /auth/refresh-token` - Renovar token

#### Funcionários

- `GET /funcionario` - Listar funcionários
- `POST /funcionario` - Criar funcionário
- `PUT /funcionario/{id}` - Atualizar funcionário

#### Registro de Ponto

- `POST /registro-ponto` - Registrar ponto
- `GET /registro-ponto/espelho/{funcionarioId}` - Espelho de ponto

#### Relatórios

- `GET /relatorios/afd/{estabelecimentoId}` - Gerar AFD
- `GET /relatorios/aej/{estabelecimentoId}` - Gerar AEJ

## 🚀 Deploy

### Deploy com Docker

1. Configure as variáveis de ambiente no servidor
2. Execute o comando de deploy:

```bash
docker-compose up -d
```

### Deploy Manual

1. **Backend**: Publique a API .NET
2. **Frontend**: Build do React Native
3. **Database**: Execute as migrações
4. **Nginx**: Configure o proxy reverso

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:

- Email: <suporte@evolua.com>
- Documentação: [Wiki do projeto](wiki-url)
- Issues: [GitHub Issues](issues-url)

---

**Evolua Ponto Sistema** - Solução completa para controle de ponto eletrônico 🕐
