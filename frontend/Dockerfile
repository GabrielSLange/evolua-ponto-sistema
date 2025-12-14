FROM nginx:alpine

# --- CACHE BUSTER ---
# Mude o número abaixo sempre que achar que o servidor não atualizou
ENV BUILD_VERSION="v2.0-fix-fonts" 

# Remove a configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copia a NOSSA configuração personalizada
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copia a pasta dist NOVA
COPY frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]