#!/bin/sh
# À exécuter SUR le VPS, depuis la racine du dépôt (toi-même — je n'ai pas accès
# SSH au serveur). Suppose que .env existe déjà à la racine (voir .env.prod.example)
# et que le premier lancement (nginx + certbot) a déjà été fait à la main.
set -e

echo "→ Récupération du code"
git pull

echo "→ Reconstruction et redémarrage des conteneurs"
docker compose -f docker-compose.prod.yml up -d --build

echo "→ Migrations Prisma"
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "→ Terminé : https://studiflow.marc-antoinemarie.com"
