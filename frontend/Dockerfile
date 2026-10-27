# Interface : construite dans le conteneur (méthode SAGA), servie par nginx ; images à version fixée (standard v3.2, sections 5 et 15)
FROM node:20.19.5-alpine3.22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27.5-alpine
RUN apk add --no-cache openssl
COPY --from=build --chmod=755 /app/dist /usr/share/nginx/html
COPY --chmod=644 nginx.conf /etc/nginx/app.conf.template
COPY --chmod=755 docker-entrypoint.sh /app-entrypoint.sh
EXPOSE 443 80
# Contrôle de santé par openssl : le wget de BusyBox ne suit pas la redirection de HTTP vers HTTPS (standard v3.2, section 15.6)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD sh -c "echo | openssl s_client -connect 127.0.0.1:443 >/dev/null 2>&1"
CMD ["/app-entrypoint.sh"]
