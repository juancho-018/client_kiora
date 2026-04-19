# Stage 1: Build
FROM node:22-alpine AS build

# Environment variables for Astro build
ARG PUBLIC_API_URL=http://localhost:3000/api
ENV PUBLIC_API_URL=$PUBLIC_API_URL

ARG PUBLIC_WEGLOT_API_KEY=wg_c28c17f31163d7786f2c5dde6f25201c5
ENV PUBLIC_WEGLOT_API_KEY=$PUBLIC_WEGLOT_API_KEY

ENV ASTRO_TELEMETRY_DISABLED=1

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

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
