# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les manifestes et installer les dépendances
COPY package*.json ./
RUN npm install --silent

# Copier le reste et builder l'app
COPY . .
RUN npm run build

# Stage 2: runtime avec nginx
FROM nginx:stable-alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration nginx pour SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script de démarrage pour générer le .env à partir des variables Railway
RUN echo '#!/bin/sh' > /docker-entrypoint.d/10-generate-env.sh \
 && echo 'echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" > /usr/share/nginx/html/.env' >> /docker-entrypoint.d/10-generate-env.sh \
 && echo 'echo "VITE_UPLOAD_BASE_URL=$VITE_UPLOAD_BASE_URL" >> /usr/share/nginx/html/.env' >> /docker-entrypoint.d/10-generate-env.sh \
 && echo 'echo "VITE_SENTRY_DSN=$VITE_SENTRY_DSN" >> /usr/share/nginx/html/.env' >> /docker-entrypoint.d/10-generate-env.sh \
 && echo 'echo "VITE_RELEASE=$VITE_RELEASE" >> /usr/share/nginx/html/.env' >> /docker-entrypoint.d/10-generate-env.sh \
 && chmod +x /docker-entrypoint.d/10-generate-env.sh

# Les variables seront injectées par Railway au runtime
ENV VITE_API_BASE_URL="" \
    VITE_UPLOAD_BASE_URL="" \
    VITE_SENTRY_DSN="" \
    VITE_RELEASE=""

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
