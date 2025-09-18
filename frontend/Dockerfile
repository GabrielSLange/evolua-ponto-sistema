# Estágio 1: Instalação das Dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Estágio 2: Build do Projeto
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/. .
RUN npm run build

# Estágio 3: Imagem Final de Produção
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expõe a porta que o Next.js usa
EXPOSE 3000

# Comando para iniciar o servidor de produção
CMD ["npx", "expo", "start"]