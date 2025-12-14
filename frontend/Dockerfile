# Usa uma imagem Nginx super leve (5MB)
FROM nginx:alpine

# Copia a pasta dist que VOCÊ gerou no seu PC para dentro do Nginx
# (Confira se sua pasta local se chama 'dist' ou 'web-build' e ajuste abaixo)
COPY frontend/dist /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Roda o Nginx
CMD ["nginx", "-g", "daemon off;"]