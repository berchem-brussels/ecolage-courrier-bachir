# Serveur : Node 20, dépendances verrouillées par npm ci, utilisateur non root appuser (10001) de PILOT, contrôle de santé ;
# image à version fixée (standard v3.2, sections 5, 10.2 et 15.6).
# Passage de node (1000) à appuser (10001) en version 0.2.0 : le volume de données existant appartient encore à 1000 ;
# la mise à jour donne une seule fois la commande chown décrite dans les notes de livraison, avant le démarrage.
FROM node:20.19.5-alpine3.22
ENV NODE_ENV=production TZ=UTC
RUN addgroup -S -g 10001 appuser && adduser -S -D -H -u 10001 -G appuser appuser
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser config/ ./config/
COPY --chown=appuser:appuser scripts/ ./scripts/
COPY --chown=appuser:appuser instance/ ./instance/
RUN mkdir -p data && chown appuser:appuser data
USER appuser
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/index.js"]
