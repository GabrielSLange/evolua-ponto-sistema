# Estágio 1: Build do projeto Expo para a web
FROM node:18-alpine AS builder

WORKDIR /app

# Instala a linha de comando do Expo
RUN npm install -g expo-cli

# Define a variável de ambiente (já chumbada como você fez)
ENV NEXT_PUBLIC_API_URL=https://evoluaponto-api.d63v0v.easypanel.host

# Copia dependências
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copia código fonte
COPY frontend/. .

# Builda o projeto (Gera a pasta dist)
RUN npx expo export -p web

# Estágio 2: Nginx com configuração SPA
FROM nginx:stable-alpine

# --- CORREÇÃO DO ERRO 404 ---
# 1. Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copia a NOSSA configuração personalizada (que tem o try_files)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
# ----------------------------

# Copia os arquivos estáticos gerados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]