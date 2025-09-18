# Estágio 1: Build do projeto Expo para a web
FROM node:18-alpine AS builder

ARG NEXT_PUBLIC_API_URL
# 2. Define uma variável de ambiente REAL dentro do contêiner usando o valor do argumento
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

# Instala a linha de comando do Expo
RUN npm install -g expo-cli

# Copia os arquivos de dependência e instala usando a flag que já funcionou
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copia todo o código do frontend
COPY frontend/. .

RUN echo "O valor da API_URL no momento do build é: $NEXT_PUBLIC_API_URL"

# --- O COMANDO CORRETO PARA EXPORTAR O PROJETO WEB ---
RUN npx expo export -p web

# Estágio 2: Imagem final com Nginx para servir os arquivos estáticos
FROM nginx:stable-alpine

# Copia os arquivos estáticos gerados pelo Expo (da pasta /app/dist) 
# para a pasta padrão do Nginx que serve conteúdo web
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# O Nginx inicia automaticamente, então não precisamos do comando CMD