# Esquema do Banco de Dados - Evolua Ponto Sistema

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Diagrama ER](#diagrama-er)
- [Tabelas](#tabelas)
- [Relacionamentos](#relacionamentos)
- [Índices](#índices)
- [Triggers](#triggers)
- [Migrações](#migrações)

## 🎯 Visão Geral

O banco de dados do Evolua Ponto Sistema utiliza PostgreSQL e foi projetado para atender aos requisitos de controle de ponto eletrônico, incluindo conformidade com a legislação brasileira (AFD e AEJ).

### Características Principais

- **Conformidade Legal**: Suporte a AFD (Portaria 671) e AEJ (eSocial)
- **Auditoria**: Campos de auditoria em todas as tabelas
- **Integridade**: Chaves estrangeiras e constraints
- **Performance**: Índices otimizados para consultas frequentes

## 🗂️ Diagrama ER

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    empresas     │    │ estabelecimentos│    │   funcionarios  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ empresa_id (FK) │◄───┤ estabelecimento_│
│ razao_social    │    │ id (PK)         │    │ id (FK)         │
│ cnpj            │    │ nome            │    │ id (PK)         │
│ endereco        │    │ endereco        │    │ nome            │
│ telefone        │    │ created_at      │    │ cpf             │
│ created_at      │    └─────────────────┘    │ cargo           │
└─────────────────┘                          │ horario_contrat │
                                             │ ativo           │
                                             │ created_at      │
                                             └─────────────────┘
                                                      │
                                                      │
                                             ┌─────────────────┐
                                             │ registros_ponto │
                                             ├─────────────────┤
                                             │ id (PK)         │
                                             │ funcionario_id  │
                                             │ timestamp_marca │
                                             │ tipo            │
                                             │ foto_url        │
                                             │ comprovante_url │
                                             │ nsr             │
                                             │ hash_sha256     │
                                             │ geolocalizacao  │
                                             │ created_at      │
                                             └─────────────────┘
                                                      │
                                                      │
                                             ┌─────────────────┐
                                             │feriados_personal│
                                             ├─────────────────┤
                                             │ id (PK)         │
                                             │ nome            │
                                             │ data            │
                                             │ empresa_id (FK) │
                                             │ created_at      │
                                             └─────────────────┘
```

## 📊 Tabelas

### empresas

Tabela principal que armazena informações das empresas.

```sql
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    endereco TEXT,
    telefone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id`: Identificador único (UUID)
- `razao_social`: Razão social da empresa
- `cnpj`: CNPJ da empresa (único)
- `endereco`: Endereço completo
- `telefone`: Telefone de contato
- `created_at`: Data de criação

### estabelecimentos

Representa os estabelecimentos de cada empresa.

```sql
CREATE TABLE estabelecimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id`: Identificador único (UUID)
- `nome`: Nome do estabelecimento
- `endereco`: Endereço do estabelecimento
- `empresa_id`: Referência à empresa (FK)
- `created_at`: Data de criação

### funcionarios

Armazena dados dos funcionários do sistema.

```sql
CREATE TABLE funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    cargo VARCHAR(100),
    horario_contratual VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id`: Identificador único (UUID)
- `nome`: Nome completo do funcionário
- `cpf`: CPF do funcionário
- `cargo`: Cargo/função
- `horario_contratual`: Horário de trabalho contratual
- `ativo`: Status do funcionário
- `estabelecimento_id`: Referência ao estabelecimento (FK)
- `created_at`: Data de criação

### registros_ponto

Tabela principal que armazena os registros de ponto.

```sql
CREATE TABLE registros_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    timestamp_marcacao TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'entrada_almoco', 'saida_almoco')),
    foto_url TEXT,
    comprovante_url TEXT,
    nsr BIGINT NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    geolocalizacao_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id`: Identificador único (UUID)
- `funcionario_id`: Referência ao funcionário (FK)
- `timestamp_marcacao`: Data/hora da marcação
- `tipo`: Tipo da marcação (entrada, saída, etc.)
- `foto_url`: URL da foto (opcional)
- `comprovante_url`: URL do comprovante PDF
- `nsr`: Número Sequencial do Rep (conformidade legal)
- `hash_sha256`: Hash SHA-256 para integridade
- `geolocalizacao_ip`: IP de origem da marcação
- `created_at`: Data de criação

### feriados_personalizados

Feriados específicos de cada empresa.

```sql
CREATE TABLE feriados_personalizados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id`: Identificador único (UUID)
- `nome`: Nome do feriado
- `data`: Data do feriado
- `empresa_id`: Referência à empresa (FK)
- `created_at`: Data de criação

## 🔗 Relacionamentos

### Hierarquia Empresarial

```
empresas (1) ──→ (N) estabelecimentos (1) ──→ (N) funcionarios
```

### Registros de Ponto

```
funcionarios (1) ──→ (N) registros_ponto
```

### Feriados

```
empresas (1) ──→ (N) feriados_personalizados
```

## 📈 Índices

### Índices de Performance

```sql
-- Índice para consultas por funcionário e data
CREATE INDEX idx_registros_ponto_funcionario_data 
ON registros_ponto(funcionario_id, timestamp_marcacao);

-- Índice para consultas por empresa e NSR
CREATE INDEX idx_registros_ponto_empresa_nsr 
ON registros_ponto(nsr) 
WHERE nsr IS NOT NULL;

-- Índice para consultas por tipo de marcação
CREATE INDEX idx_registros_ponto_tipo 
ON registros_ponto(tipo);

-- Índice para consultas por CPF
CREATE INDEX idx_funcionarios_cpf 
ON funcionarios(cpf);

-- Índice para consultas por CNPJ
CREATE INDEX idx_empresas_cnpj 
ON empresas(cnpj);

-- Índice para funcionários ativos
CREATE INDEX idx_funcionarios_ativo 
ON funcionarios(ativo) 
WHERE ativo = true;
```

### Índices Únicos

```sql
-- Garantir NSR único por empresa
CREATE UNIQUE INDEX idx_registros_ponto_nsr_empresa 
ON registros_ponto(nsr, funcionario_id);

-- Garantir CPF único
CREATE UNIQUE INDEX idx_funcionarios_cpf_unique 
ON funcionarios(cpf);
```

## ⚡ Triggers

### Trigger para NSR Automático

```sql
-- Função para gerar NSR automático
CREATE OR REPLACE FUNCTION gerar_nsr()
RETURNS TRIGGER AS $$
DECLARE
    empresa_id UUID;
    ultimo_nsr BIGINT;
BEGIN
    -- Obter ID da empresa através do funcionário
    SELECT e.id INTO empresa_id
    FROM empresas e
    JOIN estabelecimentos est ON e.id = est.empresa_id
    JOIN funcionarios f ON est.id = f.estabelecimento_id
    WHERE f.id = NEW.funcionario_id;
    
    -- Obter último NSR da empresa
    SELECT COALESCE(MAX(nsr), 0) INTO ultimo_nsr
    FROM registros_ponto rp
    JOIN funcionarios f ON rp.funcionario_id = f.id
    JOIN estabelecimentos est ON f.estabelecimento_id = est.id
    WHERE est.empresa_id = empresa_id;
    
    -- Definir novo NSR
    NEW.nsr := ultimo_nsr + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER trigger_gerar_nsr
    BEFORE INSERT ON registros_ponto
    FOR EACH ROW
    EXECUTE FUNCTION gerar_nsr();
```

### Trigger para Hash SHA-256

```sql
-- Função para gerar hash SHA-256
CREATE OR REPLACE FUNCTION gerar_hash_sha256()
RETURNS TRIGGER AS $$
DECLARE
    dados_hash TEXT;
    empresa_cnpj VARCHAR(14);
    funcionario_cpf VARCHAR(11);
BEGIN
    -- Obter dados necessários para o hash
    SELECT e.cnpj, f.cpf INTO empresa_cnpj, funcionario_cpf
    FROM empresas e
    JOIN estabelecimentos est ON e.id = est.empresa_id
    JOIN funcionarios f ON est.id = f.estabelecimento_id
    WHERE f.id = NEW.funcionario_id;
    
    -- Montar string para hash
    dados_hash := NEW.nsr || funcionario_cpf || 
                  TO_CHAR(NEW.timestamp_marcacao, 'YYYYMMDDHH24MISS') || 
                  empresa_cnpj;
    
    -- Gerar hash SHA-256
    NEW.hash_sha256 := encode(digest(dados_hash, 'sha256'), 'hex');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER trigger_gerar_hash
    BEFORE INSERT ON registros_ponto
    FOR EACH ROW
    EXECUTE FUNCTION gerar_hash_sha256();
```

## 🔄 Migrações

### Migração Inicial

```sql
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar tabelas
-- (código das tabelas acima)

-- Criar índices
-- (código dos índices acima)

-- Criar triggers
-- (código dos triggers acima)
```

### Migração de Dados

```sql
-- Exemplo de migração para adicionar campo
ALTER TABLE funcionarios 
ADD COLUMN email VARCHAR(255);

-- Criar índice para o novo campo
CREATE INDEX idx_funcionarios_email 
ON funcionarios(email);
```

## 📊 Views Úteis

### View de Espelho de Ponto

```sql
CREATE VIEW vw_espelho_ponto AS
SELECT 
    f.id as funcionario_id,
    f.nome as funcionario_nome,
    f.cpf,
    DATE(rp.timestamp_marcacao) as data,
    MIN(CASE WHEN rp.tipo = 'entrada' THEN rp.timestamp_marcacao END) as entrada,
    MIN(CASE WHEN rp.tipo = 'saida_almoco' THEN rp.timestamp_marcacao END) as saida_almoco,
    MIN(CASE WHEN rp.tipo = 'entrada_almoco' THEN rp.timestamp_marcacao END) as entrada_almoco,
    MIN(CASE WHEN rp.tipo = 'saida' THEN rp.timestamp_marcacao END) as saida
FROM funcionarios f
LEFT JOIN registros_ponto rp ON f.id = rp.funcionario_id
WHERE f.ativo = true
GROUP BY f.id, f.nome, f.cpf, DATE(rp.timestamp_marcacao);
```

### View de Relatórios AFD

```sql
CREATE VIEW vw_dados_afd AS
SELECT 
    e.cnpj,
    e.razao_social,
    est.nome as estabelecimento_nome,
    f.cpf,
    f.nome as funcionario_nome,
    rp.nsr,
    rp.timestamp_marcacao,
    rp.tipo,
    rp.hash_sha256
FROM registros_ponto rp
JOIN funcionarios f ON rp.funcionario_id = f.id
JOIN estabelecimentos est ON f.estabelecimento_id = est.id
JOIN empresas e ON est.empresa_id = e.id
ORDER BY rp.timestamp_marcacao;
```

## 🔍 Consultas Úteis

### Consulta de Funcionários por Estabelecimento

```sql
SELECT 
    f.nome,
    f.cpf,
    f.cargo,
    f.horario_contratual,
    f.ativo
FROM funcionarios f
JOIN estabelecimentos est ON f.estabelecimento_id = est.id
WHERE est.id = 'uuid-do-estabelecimento'
ORDER BY f.nome;
```

### Consulta de Registros por Período

```sql
SELECT 
    f.nome,
    rp.timestamp_marcacao,
    rp.tipo,
    rp.nsr
FROM registros_ponto rp
JOIN funcionarios f ON rp.funcionario_id = f.id
WHERE rp.timestamp_marcacao BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY f.nome, rp.timestamp_marcacao;
```

### Consulta de Totais por Funcionário

```sql
SELECT 
    f.nome,
    COUNT(*) as total_registros,
    MIN(rp.timestamp_marcacao) as primeira_marcacao,
    MAX(rp.timestamp_marcacao) as ultima_marcacao
FROM funcionarios f
JOIN registros_ponto rp ON f.id = rp.funcionario_id
WHERE rp.timestamp_marcacao >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY f.id, f.nome
ORDER BY f.nome;
```

## 🛡️ Segurança

### Políticas de Acesso

```sql
-- Habilitar Row Level Security
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;

-- Política para funcionários (apenas seus próprios dados)
CREATE POLICY funcionario_policy ON funcionarios
    FOR ALL TO funcionario_role
    USING (id = current_setting('app.current_user_id')::uuid);

-- Política para registros de ponto
CREATE POLICY registro_ponto_policy ON registros_ponto
    FOR ALL TO funcionario_role
    USING (funcionario_id = current_setting('app.current_user_id')::uuid);
```

---

Este esquema garante a integridade dos dados, conformidade legal e performance otimizada para o sistema de controle de ponto eletrônico.
