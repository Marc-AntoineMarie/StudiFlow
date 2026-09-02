# Dev image — le code est monté en volume, hot-reload via `nest start --watch`.
FROM node:22-alpine

RUN apk add --no-cache openssl poppler-utils

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

# "uploads" est un volume nommé (docker-compose.yml) : comme il n'existe pas encore
# dans l'image, Docker le seed root-owned si on ne le pré-crée pas ici (même piège
# que dist/ ou .next/, cf. journal de bord). On le crée avec les bons droits AVANT
# de passer en "node" (uid 1000, identique à l'utilisateur hôte habituel).
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3001
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
