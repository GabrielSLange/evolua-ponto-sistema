# Guia de Deploy - Evolua Ponto Sistema

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Deploy com Docker](#deploy-com-docker)
- [Deploy Manual](#deploy-manual)
- [Configuração do Nginx](#configuração-do-nginx)
- [SSL/HTTPS](#sslhttps)
- [Monitoramento](#monitoramento)
- [Backup](#backup)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Este guia cobre o processo completo de deploy do Evolua Ponto Sistema, incluindo configuração de ambiente, containerização com Docker, configuração de proxy reverso e implementação de SSL.

### Arquitetura de Deploy

```
Internet → Nginx (SSL) → Backend API → PostgreSQL
                ↓
           Frontend (Static)
```

## 🔧 Pré-requisitos

### Servidor

- **OS**: Ubuntu 20.04+ ou CentOS 8+
- **RAM**: Mínimo 4GB (recomendado 8GB)
- **CPU**: Mínimo 2 cores
- **Storage**: Mínimo 50GB SSD
- **Rede**: IP público e domínio configurado

### Software

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Certbot (para SSL)

## ⚙️ Configuração do Ambiente

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configuração de Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Database
POSTGRES_DB=evolua_ponto
POSTGRES_USER=evolua_user
POSTGRES_PASSWORD=senha_super_segura_123

# JWT
JWT_SECRET=chave_jwt_muito_secreta_com_pelo_menos_32_caracteres
JWT_AUDIENCE=evolua-ponto-api
JWT_ISSUER=evolua-ponto-system

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_service_role_key_aqui

# Frontend
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api

# PgAdmin
PGADMIN_EMAIL=admin@seudominio.com
PGADMIN_PASSWORD=senha_admin_pgadmin

# Domínio
DOMAIN=seudominio.com
```

### 3. Configuração de Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 🐳 Deploy com Docker

### 1. Clone e Configuração

```bash
# Clone o repositório
git clone <repository-url>
cd evolua-ponto-sistema

# Copiar arquivo de ambiente
cp .env.example .env
# Editar .env com suas configurações
```

### 2. Deploy de Produção

```bash
# Build e start dos containers
docker-compose up -d --build

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 3. Verificação dos Serviços

```bash
# Verificar containers rodando
docker ps

# Testar conectividade
curl http://localhost/api/health

# Verificar banco de dados
docker-compose exec database psql -U evolua_user -d evolua_ponto -c "SELECT version();"
```

## 🔧 Deploy Manual

### 1. Backend (.NET)

```bash
# Instalar .NET 8 SDK
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install dotnet-sdk-8.0 -y

# Build da aplicação
cd backend/EvoluaPonto.Api/EvoluaPonto.Api
dotnet restore
dotnet publish -c Release -o /var/www/evolua-ponto-api

# Configurar serviço systemd
sudo nano /etc/systemd/system/evolua-ponto-api.service
```

**Conteúdo do arquivo de serviço:**

```ini
[Unit]
Description=Evolua Ponto API
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/dotnet /var/www/evolua-ponto-api/EvoluaPonto.Api.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ConnectionStrings__DefaultConnection="Host=localhost;Database=evolua_ponto;Username=evolua_user;Password=senha"

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviço
sudo systemctl enable evolua-ponto-api
sudo systemctl start evolua-ponto-api
```

### 2. Frontend (React Native/Expo)

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Build do frontend
cd frontend
npm install
npm run build

# Copiar arquivos para servidor web
sudo cp -r dist/* /var/www/html/
```

### 3. PostgreSQL

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Configurar banco
sudo -u postgres psql
CREATE DATABASE evolua_ponto;
CREATE USER evolua_user WITH PASSWORD 'senha_super_segura_123';
GRANT ALL PRIVILEGES ON DATABASE evolua_ponto TO evolua_user;
\q

# Executar migrações
cd backend/EvoluaPonto.Api/EvoluaPonto.Api
dotnet ef database update
```

## 🌐 Configuração do Nginx

### 1. Instalação

```bash
sudo apt install nginx -y
```

### 2. Configuração Principal

```nginx
# /etc/nginx/sites-available/evolua-ponto
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # PgAdmin (opcional)
    location /pgadmin/ {
        proxy_pass http://localhost:5050/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/evolua-ponto /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 SSL/HTTPS

### 1. Obter Certificado SSL

```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Obter certificado
sudo certbot certonly --standalone -d seudominio.com -d www.seudominio.com

# Reiniciar Nginx
sudo systemctl start nginx
```

### 2. Configuração HTTPS

```nginx
# Atualizar configuração do Nginx
server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Resto da configuração...
}

# Redirect HTTP para HTTPS
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar cron para renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### 1. Logs

```bash
# Logs da aplicação
sudo journalctl -u evolua-ponto-api -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do Docker
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 2. Monitoramento de Recursos

```bash
# Instalar htop
sudo apt install htop -y

# Monitorar recursos
htop

# Verificar espaço em disco
df -h

# Verificar uso de memória
free -h
```

### 3. Health Checks

```bash
# Script de health check
#!/bin/bash
# health-check.sh

API_URL="https://seudominio.com/api/health"
FRONTEND_URL="https://seudominio.com"

# Verificar API
if curl -f -s $API_URL > /dev/null; then
    echo "✅ API está funcionando"
else
    echo "❌ API está com problemas"
fi

# Verificar Frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "✅ Frontend está funcionando"
else
    echo "❌ Frontend está com problemas"
fi
```

## 💾 Backup

### 1. Backup do Banco de Dados

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/evolua-ponto"
DB_NAME="evolua_ponto"
DB_USER="evolua_user"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup criado: backup_$DATE.sql.gz"
```

### 2. Backup dos Arquivos

```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/evolua-ponto"
SOURCE_DIR="/var/www"

# Backup dos arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C $SOURCE_DIR .

echo "Backup de arquivos criado: files_$DATE.tar.gz"
```

### 3. Automatização de Backup

```bash
# Adicionar ao crontab
sudo crontab -e

# Backup diário às 2h da manhã
0 2 * * * /path/to/backup-db.sh
0 3 * * * /path/to/backup-files.sh
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. API não responde

```bash
# Verificar se o serviço está rodando
sudo systemctl status evolua-ponto-api

# Verificar logs
sudo journalctl -u evolua-ponto-api -n 50

# Verificar porta
sudo netstat -tlnp | grep :5000
```

#### 2. Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U evolua_user -d evolua_ponto

# Verificar logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 3. Frontend não carrega

```bash
# Verificar arquivos
ls -la /var/www/html/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL não funciona

```bash
# Verificar certificado
sudo certbot certificates

# Testar SSL
openssl s_client -connect seudominio.com:443

# Verificar configuração do Nginx
sudo nginx -t
```

### Comandos Úteis

```bash
# Reiniciar todos os serviços
sudo systemctl restart nginx
sudo systemctl restart evolua-ponto-api
sudo systemctl restart postgresql

# Verificar uso de recursos
docker stats

# Limpar containers não utilizados
docker system prune -a

# Verificar espaço em disco
du -sh /var/www/*
du -sh /var/lib/postgresql/*
```

## 📋 Checklist de Deploy

### Pré-Deploy

- [ ] Servidor configurado com requisitos mínimos
- [ ] Domínio apontando para o servidor
- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL obtidos
- [ ] Firewall configurado

### Deploy

- [ ] Código clonado e configurado
- [ ] Banco de dados criado e migrado
- [ ] Aplicação backend deployada
- [ ] Frontend buildado e deployado
- [ ] Nginx configurado
- [ ] SSL configurado

### Pós-Deploy

- [ ] Testes de funcionalidade realizados
- [ ] Monitoramento configurado
- [ ] Backup automatizado configurado
- [ ] Documentação atualizada
- [ ] Equipe treinada

---

Para suporte adicional, consulte os logs do sistema e a documentação específica de cada componente.
