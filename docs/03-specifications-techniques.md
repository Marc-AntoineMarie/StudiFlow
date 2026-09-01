# Spécifications techniques

> Partie (c) du dossier technique. Se remplit au fil de l'eau.
> Dernière mise à jour : 2026-09-01.

## 1. Choix de stack et justification

| Couche | Choix | Justification |
|---|---|---|
| Backend | **NestJS 11** | Architecture modulaire imposée → séparation des responsabilités claire, attendue au barème. Stack déjà maîtrisée (projet `Synapse-CRM`), gain de temps décisif sur 4,5 jours. |
| ORM / DB | **Prisma 6 + PostgreSQL 16** | Schéma typé, migrations versionnées, seed simple. `@db.Date` pour les dates de mission (granularité jour). |
| Auth | **JWT** (email + mot de passe, `argon2`) | Mono-utilisateur : le plus simple qui satisfasse « compte unique et sécurisé ». Magic link écarté (dépendance mail en prod + friction démo). |
| Frontend | **Next.js (App Router) + shadcn/ui + Tailwind** | Composants prêts (table, dialog, form) → vitesse. Design volontairement minimal au MVP. |
| Stockage fichiers | **Disque + volume Docker**, servi par route authentifiée | Abstraction `StorageService`, remplacement S3 possible (roadmap). |
| Conteneurs | **Docker Compose** | README « une commande ». `docker-compose.yml` (dev) + `docker-compose.prod.yml` (VPS). |
| Tests | **Jest** | Le calcul des 12 mois glissants est une fonction pure testée isolément (14 cas). |
| CI | **GitHub Actions** | `npm ci` + `prisma generate` + `lint:ci` + `npm test` à chaque push. |

**Écarté de la stack Synapse** (trop lourd pour un build solo) : WebSocket/Socket.io,
envoi de mails, multi-rôles, registry GHCR, environnement de préprod séparé.

## 2. Architecture

Monorepo :

```text
cadre/
  backend/     NestJS + Prisma
  frontend/    Next.js
  docs/        ce dossier
  docker-compose.yml         dev
  docker-compose.prod.yml    prod (à venir)
  scripts/                   deploy.sh (à venir)
```

### Backend — modules (cible)

- `health/` — `GET /api/health` (teste `SELECT 1`). **Fait.**
- `auth/` — `POST /api/auth/login`, `GET /api/auth/me`, `JwtAuthGuard` global.
- `missions/` — CRUD + filtres `type` / `statut`.
- `documents/` — upload (multer, 10 Mo, `pdf`/`png`/`jpg`/`webp`), download authentifié,
  catégorie, rattachement mission ou global.
- `projets/` — CRUD portfolio, validation lien vidéo YouTube/Vimeo.
- `parametres/` — `GET` / `PATCH` de la ligne `Config` (id = 1).
- `dashboard/` — `GET /api/dashboard` : charge missions + config, appelle
  `calc/calculerIndicateurs(...)`, renvoie le JSON.
- `calc/` — **fonction pure** `rolling-window.ts`, aucune dépendance framework. **Fait.**
- `export/` — `GET /api/export/calendar.ics`, `GET /api/export/missions.csv`.
- `prisma/` — `PrismaService` (`@Global`). **Fait.**
- `common/` — DTO partagés, filtre d'exceptions, pipes, limites upload.

### Conventions API

- Préfixe global `/api`.
- `ValidationPipe` global (`whitelist: true`, `transform: true`).
- CORS : origines depuis `CORS_ORIGINS` (défaut `http://localhost:4000`).
- Toutes les routes derrière le guard JWT **sauf** `POST /api/auth/login` et
  `GET /api/health`.

## 3. Modèle de données

Voir `docs/02-modele-de-donnees.md`. Migration initiale :
`backend/prisma/migrations/20260901114507_init`.

## 4. Règle métier des 12 mois glissants

Voir `docs/04-regle-12-mois-glissants.md`. Implémentation testée :
`backend/src/calc/rolling-window.ts`.

## 5. Sécurité (base)

- Mots de passe : `argon2` (jamais en clair). **Fait.**
- JWT : secret en variable d'environnement (`JWT_SECRET`, valeur aléatoire dédiée en
  dev, jamais commitée), **expiration 12 h**. **Fait.**
- `JwtAuthGuard` global (`APP_GUARD`) : toute route est protégée par défaut, `@Public()`
  lève la protection explicitement (`/auth/login`, `/health`). **Fait.**
- Rate-limit `@nestjs/throttler` : 100 req/min par défaut, **5 essais/min** sur
  `POST /api/auth/login`. **Fait, vérifié** (le 6ᵉ essai renvoie `429`).
- `POST /api/auth/login` renvoie toujours `401 Identifiants invalides`, jamais de
  distinction email inconnu / mot de passe incorrect. **Fait.**
- Aucune donnée, **téléchargement de fichier compris**, accessible sans jeton valide.
- Fichiers jamais servis en statique public ; nom sur disque = UUID (anti path
  traversal). Limite 10 Mo, types whitelistés.
- HTTPS assuré par nginx + Let's Encrypt sur le VPS.
- Transport du token : `localStorage` + header `Authorization: Bearer` au MVP ;
  cookie `httpOnly` = durcissement roadmap.

## 6. Stratégie de stockage des fichiers

- Dossier `uploads/` monté sur volume Docker (`uploads:/app/uploads`), en dev comme en
  prod.
- Base : métadonnées uniquement (`nomFichier`, `stockageNom`, `mimeType`,
  `tailleOctets`, `categorie`, `missionId?`).
- Accès via `GET /api/documents/:id/download` (authentifié), `Content-Disposition`
  avec le `nomFichier` d'origine.
- `StorageService` abstrait pour permettre un backend S3 compatible (roadmap).

## 7. Procédure de déploiement (à détailler à l'étape déploiement)

- Cible : VPS personnel, nginx + certbot déjà en place.
- `docker-compose.prod.yml` : `db` (Postgres + volume, pas de port exposé) + `backend`
  + `frontend`.
- Script `scripts/deploy.sh` : SSH → `git pull` → `docker compose -f
  docker-compose.prod.yml up -d --build` → `npx prisma migrate deploy`.
- Sous-domaine : choisi au moment du déploiement (domaine du propriétaire ou `desec.io`
  pour les tests).
- GitHub Actions : `lint` + `test` uniquement, pas de déploiement automatique au début.

## 8. Ports (convention reprise de Synapse-CRM)

| Service | Interne | Exposé en local |
|---|---|---|
| backend | 3001 | 4001 |
| db (Postgres) | 5432 | 5433 |
| frontend | 4000 | 4000 |
