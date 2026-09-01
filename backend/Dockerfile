# Dev image — le code est monté en volume, hot-reload via `nest start --watch`.
FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

# Tourne en "node" (uid 1000), identique à l'utilisateur hôte habituel : évite que
# les fichiers écrits dans le bind-mount (ex. dist/ en mode watch) passent root.
USER node

EXPOSE 3001
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
