# Spécifications techniques

> Partie (c) du dossier technique. Se remplit au fil de l'eau.
> Dernière mise à jour : 2026-09-01.

## 1. Choix de stack et justification

| Couche | Choix | Justification |
|---|---|---|
| Backend | **NestJS 11** | Architecture modulaire imposée → séparation des responsabilités claire, attendue au barème. Stack déjà maîtrisée (projet `Synapse-CRM`), gain de temps décisif sur 4,5 jours. |
| ORM / DB | **Prisma 6 + PostgreSQL 16** | Schéma typé, migrations versionnées, seed simple. `@db.Date` pour les dates de mission (granularité jour). |
| Auth | **JWT** (email + mot de passe, `argon2`) | Mono-utilisateur : le plus simple qui satisfasse « compte unique et sécurisé ». Magic link écarté (dépendance mail en prod + friction démo). |
| Frontend | **Next.js (App Router) + Tailwind** | Composants faits main dans l'esprit shadcn/ui → vitesse. Direction artistique validée le 2026-09-01 (`docs/06-direction-artistique.md`). |
| Stockage fichiers | **Disque + volume Docker**, servi par route authentifiée | Abstraction `StorageService`, remplacement S3 possible (roadmap). |
| Conteneurs | **Docker Compose** | README « une commande ». `docker-compose.yml` (dev) + `docker-compose.prod.yml` (VPS, à écrire). |
| Tests | **Jest** | Le calcul des 12 mois glissants et les autres règles métier sont des fonctions pures testées isolément. 62 tests backend. |
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

### Backend — modules

- `health/` — `GET /api/health` (teste `SELECT 1`). **Fait.**
- `auth/` — `POST /api/auth/login`, `GET /api/auth/me`, `JwtAuthGuard` global. **Fait.**
- `missions/` — CRUD + filtres `type` / `statut`, validation métier (`mission-validation.ts`). **Fait.**
- `documents/` — upload (multer, 10 Mo, `pdf`/`png`/`jpg`/`webp`), download authentifié,
  catégorie, rattachement mission ou global. **Fait.**
- `projets/` — CRUD portfolio, validation lien vidéo YouTube/Vimeo (`video-lien.ts`). **Fait.**
- `parametres/` — `GET` / `PATCH` de la ligne `Config` (id = 1). **Fait.**
- `dashboard/` — `GET /api/dashboard` : charge missions + config, appelle
  `calc/calculerIndicateurs(...)`, renvoie le JSON. **Fait.**
- `calc/` — **fonction pure** `rolling-window.ts`, aucune dépendance framework. **Fait.**
- `export/` — module différenciant du brief, cf. §9. **Fait.**
- `storage/` — abstraction disque (`storage.service.ts`), utilisée par `documents/`. **Fait.**
- `prisma/` — `PrismaService` (`@Global`). **Fait.**

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
- Aucune donnée, **téléchargement de fichier et exports compris**, accessible sans
  jeton valide. **Fait, vérifié.**
- Fichiers jamais servis en statique public ; nom sur disque = UUID (anti path
  traversal). Limite 10 Mo, types whitelistés. **Fait.**
- HTTPS assuré par nginx + Let's Encrypt sur le VPS (déploiement à venir).
- Transport du token : `localStorage` + header `Authorization: Bearer` au MVP ;
  cookie `httpOnly` = durcissement roadmap.

## 6. Stratégie de stockage des fichiers — **fait**

- Dossier `uploads/` monté sur volume Docker (`uploads:/app/uploads`), en dev comme en
  prod. Chemin lu depuis `UPLOAD_DIR` (variable d'env, défaut `./uploads`).
- Base : métadonnées uniquement (`nomFichier`, `stockageNom` = UUID, `mimeType`,
  `tailleOctets`, `categorie`, `missionId?`).
- Upload : `POST /api/documents` en `multipart/form-data`, `FileInterceptor` en
  `memoryStorage` (le buffer est écrit sur disque par `StorageService`, pas par
  multer directement — permet de garder la validation MIME et la limite de taille
  au même endroit, et facilite un remplacement S3 plus tard).
- Limite **10 Mo**, types autorisés `pdf`/`png`/`jpeg`/`webp` (whitelist stricte,
  rejet `400` explicite sinon).
- Accès via `GET /api/documents/:id/download` (authentifié), `res.download()` avec le
  `nomFichier` d'origine — le frontend n'a pas besoin de lire ce header : il connaît
  déjà le nom via l'objet chargé en mémoire.
- Suppression : fichier disque supprimé **puis** ligne en base.
- `StorageService` abstrait (`enregistrer`/`supprimer`/`cheminComplet`) pour permettre
  un backend S3 compatible (roadmap) sans toucher au module `documents/`.
- **Piège Docker rencontré et corrigé** : le volume `uploads` (nommé) naissait
  root-owned car `/app/uploads` n'existait pas dans l'image — `EACCES` au premier
  upload. Fix : pré-création + `chown` dans le `Dockerfile` avant `USER node`, plus
  suppression du volume existant pour repartir d'un état propre. Règle générale
  ajoutée à `AGENTS.md` §6.

## 7. Procédure de déploiement — **fait**

- Cible : VPS personnel du propriétaire (nginx + certbot déjà en place, hors du
  contrôle de l'assistant IA — accès SSH et configuration nginx restent entièrement
  du côté du propriétaire, voir note ci-dessous).
- Sous-domaine : `studiflow.marc-antoinemarie.com`.
- `docker-compose.prod.yml` (racine du dépôt) : `db` (Postgres 16, volume nommé, port
  interne uniquement) + `backend` + `frontend`, build via `Dockerfile.prod` propres à
  chaque service (image compilée, pas de bind-mount ni de hot-reload, contrairement
  aux `Dockerfile`/`Dockerfile.dev` de dev). `backend` et `frontend` publient leurs
  ports uniquement sur `127.0.0.1` — seul nginx (sur l'hôte) doit être joignable
  depuis Internet.
- `backend/Dockerfile.prod` : build multi-étage, `node dist/src/main.js` au démarrage
  (le build Nest sort dans `dist/src/`, pas `dist/`, à cause de `sourceRoot: "src"`
  dans `nest-cli.json` — piège identifié en testant l'image, corrigé aussi dans
  `start:prod` du `package.json`). Réutilise `docker-entrypoint.sh` (migrations +
  seed) tel quel.
- `frontend/Dockerfile.prod` : build Next.js `output: 'standalone'`, servi par
  `node server.js`. Point d'attention : `NEXT_PUBLIC_API_URL` est lu côté client et
  donc figé **au build** (`--build-arg`, pas seulement une variable d'environnement
  du conteneur au runtime).
- `deploy/nginx-studiflow.conf` : bloc nginx (HTTP, certbot ajoute ensuite le TLS)
  proxyfiant `/api/` vers le backend et `/` vers le frontend, avec
  `client_max_body_size 12m` (défaut nginx = 1 Mo, insuffisant pour les documents
  jusqu'à 10 Mo). Fourni comme fichier à copier par le propriétaire — non appliqué
  par l'assistant.
- `.env.prod.example` : gabarit des variables de prod (secrets à générer sur le
  serveur, jamais réutiliser ceux de dev).
- `scripts/deploy.sh` : à lancer sur le VPS (`git pull` → `up -d --build` →
  `prisma migrate deploy`), pour les mises à jour après le premier déploiement.
- **Validé en local** avant remise au propriétaire : les deux `Dockerfile.prod`
  buildent proprement, et un stack complet (db + backend + frontend, ports
  alternatifs, identifiants jetables) a démarré, migré, seedé et répondu correctement
  (`/api/health`, login, page `/login`) — voir `docs/journal-de-bord.md`.
- **Contrainte explicite du propriétaire** : l'assistant IA prépare les fichiers de
  déploiement et peut vérifier une configuration existante, mais n'a ni accès SSH au
  VPS ni le droit de modifier la configuration nginx en place — c'est le propriétaire
  qui exécute les commandes sur le serveur.
- GitHub Actions : `lint` + `test` uniquement, pas de déploiement automatique.

## 8. Ports (convention reprise de Synapse-CRM)

| Service | Interne | Exposé en local |
|---|---|---|
| backend | 3001 | 4001 |
| db (Postgres) | 5432 | 5433 |
| frontend | 4000 | 4000 |

## 9. Export — module différenciant — **fait**

- `GET /api/export/calendar.ics` et `GET /api/export/missions.csv`, **protégés**
  comme le reste de l'API (aucune route d'export publique).
- `calc/` mis à part, deux autres fonctions pures suivent le même principe :
  - `export/ics.ts` : génère un calendrier RFC 5545 sans dépendance externe. Point
    d'attention testé explicitement : `DTEND` d'un événement journée-entière est
    **exclusif** → toujours `dateFin + 1 jour`, y compris à cheval sur un changement
    de mois. Échappement des caractères spéciaux (`,` `;` retour ligne).
  - `export/csv.ts` : génère un CSV avec **`;`** comme délimiteur (convention Excel
    en locale française, où `,` est déjà le séparateur décimal). Échappement RFC 4180
    (guillemets doublés si la valeur contient `;`, `,`, `"` ou un retour ligne).
- Le CSV est préfixé d'un BOM UTF-8 pour qu'Excel détecte l'encodage (accents, €) —
  construit via `String.fromCharCode(0xfeff)` plutôt qu'un caractère littéral collé
  dans le fichier source (invisible, peu fiable à l'édition).
- Frontend : boutons sur la page Missions, téléchargement authentifié via
  `apiDownloadBlob` (même mécanique que le téléchargement de documents).
