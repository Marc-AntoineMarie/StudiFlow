# Cadré

Outil privé pour un monteur vidéo indépendant qui alterne **intermittence du
spectacle** (heures déclarées, seuil des 507 h sur 12 mois glissants) et **freelance**
(jours facturés, chiffre d'affaires). L'outil rend cette distinction lisible : missions
et calendrier, tableau de bord, documents, portfolio.

> Documentation de reprise complète : [`AGENTS.md`](./AGENTS.md).
> Dossier technique : [`docs/`](./docs/).

## Stack

| | |
|---|---|
| Backend | NestJS · Prisma · PostgreSQL 16 · JWT |
| Frontend | Next.js (App Router) · shadcn/ui *(à venir)* |
| Infra | Docker Compose · déploiement VPS (nginx + certbot) |

## Lancer en local

Prérequis : Docker + Docker Compose.

```bash
cp .env.example .env          # ajuster si besoin
docker compose up -d --build  # db + backend ; migrations + seed automatiques
```

- API : <http://localhost:4001/api>
- Santé : <http://localhost:4001/api/health> → `{"status":"ok","db":"up"}`
- PostgreSQL : `localhost:5433` (user `cadre` / db `cadre`)
- Compte de démonstration : `demo@cadre.local` / `demo-cadre-2026` *(auth branchée à l'étape suivante)*

Le frontend sera ajouté au service `frontend` (port `4000`).

## Commandes utiles

```bash
docker compose logs -f backend                       # logs
docker compose exec backend npm test                 # tests unitaires (dont le calcul 12 mois)
docker compose exec backend npx prisma migrate dev   # nouvelle migration après modif du schema
docker compose exec backend npm run seed             # re-seed User + Config
docker compose down                                   # arrêt (les volumes db_data / uploads persistent)
```

> Après avoir modifié les dépendances de `backend/package.json`, recréer les volumes
> anonymes : `docker compose up -d --build --renew-anon-volumes`.

## Tests

Le cœur métier (règle des 12 mois glissants) est une fonction pure testée isolément :
`backend/src/calc/rolling-window.ts` + `.spec.ts` (14 cas). Spécification :
[`docs/04-regle-12-mois-glissants.md`](./docs/04-regle-12-mois-glissants.md).

```bash
cd backend && npm install && npm test
```
