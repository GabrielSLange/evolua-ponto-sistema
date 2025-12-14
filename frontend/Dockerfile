FROM nginx:alpine

# Cache Buster: Mudamos a versão para garantir
ENV DEPLOY_VERSION="v3.0-pasta-nova"

RUN rm /etc/nginx/conf.d/default.conf

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# --- MUDANÇA AQUI ---
# Copia a pasta 'web-build' (nova) em vez da 'dist' (velha/cacheada)
COPY frontend/web-build /usr/share/nginx/html
# --------------------

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]