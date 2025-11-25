# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les manifestes et installer les dépendances (utilise package.json)
COPY package*.json ./
RUN npm install --silent

# Copier le reste et builder l'app
COPY . .
RUN npm run build

# Stage 2: runtime léger avec nginx
FROM nginx:stable-alpine
# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuration nginx pour SPA (fallback vers index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

ARG RAILWAY_ENVIRONMENT
ARG VITE_API_BASE_URL
ARG VITE_UPLOAD_BASE_URL
ARG VITE_SENTRY_DSN
ARG VITE_RELEASE

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
