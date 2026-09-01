#!/bin/sh
set -e

echo "→ Prisma : application des migrations"
npx prisma migrate deploy

echo "→ Seed : utilisateur unique + Config"
npx ts-node prisma/seed.ts || echo "seed ignoré (déjà fait ou non critique)"

echo "→ Démarrage de l'API"
exec "$@"
