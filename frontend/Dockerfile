# Estágio 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g expo-cli

# --- AQUI ESTÁ O SEGREDINHO ---
# 1. Definimos que esse Dockerfile aceita um argumento chamado API_URL
ARG API_URL

# 2. Pegamos esse argumento e transformamos na variável de ambiente que o seu código usa
ENV NEXT_PUBLIC_API_URL=$API_URL
# ------------------------------

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/. .

RUN npx expo export -p web

# Estágio 2: Nginx
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]