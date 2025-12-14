FROM nginx:alpine

# Remove a configuração padrão do Nginx para não dar conflito
RUN rm /etc/nginx/conf.d/default.conf

# Copia a NOSSA configuração personalizada
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copia a pasta dist (que você gerou no build local)
COPY frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]