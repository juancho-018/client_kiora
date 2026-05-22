# Stage 1: Build
FROM node:22-alpine AS build

# Variables PUBLIC_* se inyectan en tiempo de build (Astro las sustituye en el bundle).
# Relativo: Nginx del stage 2 reenvía /api al gateway (ver nginx.conf).
ARG PUBLIC_API_URL=/api
ENV PUBLIC_API_URL=$PUBLIC_API_URL

ARG PUBLIC_KIOSK_API_KEY=
ENV PUBLIC_KIOSK_API_KEY=$PUBLIC_KIOSK_API_KEY

ARG PUBLIC_WEGLOT_API_KEY=
ENV PUBLIC_WEGLOT_API_KEY=$PUBLIC_WEGLOT_API_KEY

ARG PUBLIC_KIOSK_URL=
ENV PUBLIC_KIOSK_URL=$PUBLIC_KIOSK_URL

ARG PUBLIC_SENTRY_DSN=
ENV PUBLIC_SENTRY_DSN=$PUBLIC_SENTRY_DSN

ARG SENTRY_AUTH_TOKEN=
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

ENV ASTRO_TELEMETRY_DISABLED=1

WORKDIR /app

# Install dependencies (locked versions for reproducibility)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
