# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
ARG API_BASE_URL=https://solar-app-ochre.vercel.app/api/v1
ENV API_BASE_URL=$API_BASE_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
