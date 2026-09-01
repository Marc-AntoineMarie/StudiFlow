# Journal de bord

Ordre chronologique inverse (le plus récent en haut). Une entrée par session ou par
lot de changements notable. Sert de fil de reprise et alimente le *Guide de reprise*
(dossier technique, partie d).

---

## 2026-09-01 — Premier commit (historique initial, 28 commits)

Tout le travail de la journée était non versionné jusqu'ici. Le propriétaire a demandé
un historique **granulaire** avant de continuer (« limite fichier par fichier »).
Comme rien n'avait été commité au fil de l'eau, impossible de rejouer l'historique
réel intermédiaire (ex. `app.module.ts` ou `docs/03-specifications-techniques.md` ont
été modifiés plusieurs fois dans la journée, mais seul l'état final existe sur disque).
Découpage retenu : le plus fin possible **sans jamais laisser un commit dans un état
cassé** (ex. un contrôleur commité avant le service dont il dépend). `app.module.ts`
est rattaché au commit `dashboard`, dernier module branché aujourd'hui.

**28 commits**, `docs(cadrage)` → `docs: readme de lancement`, tous sur `main` (pas de
commit avant celui-ci). Pas de trailer `Co-Authored-By` (demande explicite du
propriétaire). `.env` vérifié absent de l'index (secrets non versionnés).

---

## 2026-09-01 — Lancement de la passe de design + module Dashboard + frontend

Le propriétaire a fourni des maquettes (dashboard sombre + page login) : ça lance
officiellement la passe de design frontend, plus tôt que prévu au cadrage initial
(qui la reportait après le MVP backend). Décision : petit détour, on construit
`GET /api/dashboard` (rapide, le calcul existait déjà) puis le socle frontend +
la page login, pour valider la direction artistique avant d'investir dans les
graphiques plus lourds du dashboard principal.

**Backend — module Dashboard :**

- `GET /api/dashboard` : charge missions + config via Prisma, délègue à
  `calc/calculerIndicateurs`. 2 tests de câblage (`dashboard.service.spec.ts`).
  **28/28 tests verts.**
- Vérifié en conditions réelles : renvoie 24h intermittence, 1500€ CA freelance,
  répartition 60/40 — cohérent avec les missions créées à l'étape précédente.

**Frontend — socle + page login. Direction artistique fixée dans
`docs/06-direction-artistique.md` :**

- Next.js 15 (App Router) + Tailwind 3 + TypeScript, `lucide-react` pour les icônes.
- Polices : **Space Grotesk** (titres/chiffres) + **Inter** (UI), via `next/font/google`.
- Palette sombre en variables CSS (`globals.css`) : fond marine `#080b14`, cartes
  `#10152a`, accents bleu/or/violet — cf. doc pour le détail.
- Composants de base faits main (`components/ui/`) : `Button`, `Input`, `Card` — pas
  de CLI shadcn exécutée, même esprit.
- `lib/auth.ts` (token en localStorage), `lib/api.ts` (fetch wrapper + gestion 401).
- `/login` : reprend la structure de la maquette (panneau + carte), reskinnée sombre.
  **Écart assumé** : la photo de bureau est remplacée par une composition graphique
  (dégradés + icônes lucide) — pas d'image externe non fournie/licenciée.
- `(app)/dashboard` : **placeholder fonctionnel** (3 cartes brutes), pas encore la
  vraie maquette (jauge/aire/donut) — sert à prouver la chaîne auth → API → UI avant
  d'investir dans les graphiques. Sera remplacé à l'étape suivante.
- `docker-compose.yml` : service `frontend` ajouté (port 4000).

**Pièges Docker (même famille que le backend, corrigés à la racine) :**

- `frontend/Dockerfile.dev` avait le même souci `USER node` que le backend — appliqué
  d'emblée cette fois.
- Piège **nouveau** : le volume anonyme `/app/.next` naissait **root-owned** même
  avec `USER node`, car Docker crée un volume anonyme vide (root) quand le chemin
  n'existe pas encore dans l'image. Fix : `RUN mkdir -p .next && chown -R node:node
  /app` **avant** `USER node`, pour que le volume soit seedé avec les bons droits.

**Vérifié en conditions réelles (Playwright headless, capture d'écran) :**

- `/login` : rendu conforme à la direction artistique, 0 erreur console.
- Flux complet : saisie identifiants démo → `POST /auth/login` → redirection
  `/dashboard` → `GET /api/dashboard` → affichage des vrais chiffres. 0 erreur console.

**Prochaine étape :** en attente de validation de la direction artistique par le
propriétaire, puis construction du vrai dashboard (jauge circulaire, aire CA
dégradée, donut répartition, cartes secondaires) — bibliothèque de graphes à choisir
à ce moment-là.

---

## 2026-09-01 — Vrai dashboard (jauge + aire CA + donut) + validation direction artistique

Le propriétaire a validé la direction artistique sur la page login (« ça dépasse mes
espérances ») avec un seul ajustement : contenu centré verticalement au lieu de collé
en haut — corrigé (`main` en `flex items-center justify-center min-h-screen`). Feu
vert pour construire le vrai dashboard.

**Fait :**

- `frontend/src/components/dashboard/` : `GaugeHeures` (anneau SVG fait main, gradient
  bleu, pas de lib pour un seul anneau), `CaAreaChart` (Recharts, aire dégradée or),
  `RepartitionDonut` (Recharts, donut 2 parts + légende, état vide si aucune mission).
- Dépendance ajoutée : `recharts`.
- `(app)/dashboard/page.tsx` réécrit : en-tête (marque + déconnexion), eyebrow
  « TABLEAU DE BORD », H1 « Vue d'activité », grille de 3 cartes reprenant fidèlement
  la maquette (icône + label + badge contextuel par carte).
- **Décision de périmètre** (documentée ici, à rappeler en soutenance) : la 2ᵉ section
  de la maquette (« Indicateurs complémentaires » — progression mensuelle, missions en
  cours, équilibre 62/38) n'est **pas construite**. Le brief plafonne explicitement à
  **trois indicateurs maximum**, et cette section demanderait des données hors
  périmètre (tendance mensuelle, comptage de missions en cours par tag). Notée dans la
  roadmap comme évolution possible plutôt que codée à moitié.
- Petit correctif visuel : le premier label du graphe CA (« Oct ») était rogné en bord
  de carte → `padding` ajouté sur l'axe X.

**Vérifié en conditions réelles (Playwright, capture pleine page) :** flux login →
dashboard → jauge (24/507h, 5%), aire CA (pic à 1500€ en février, reste à 0), donut
(60/40) — tout correspond aux vraies missions en base. 0 erreur console. Lint et build
frontend propres.

**Prochaine étape :** documents/projets/paramètres/export côté back, puis leurs pages
frontend dans la même direction artistique — au choix du propriétaire, qui a délégué
la suite.

---

## 2026-09-01 — Module Missions (CRUD + validation)

**Fait :**

- `src/missions/mission-validation.ts` : fonction `validerEtNormaliserMission`
  (indépendante de Prisma/Nest, comme `calc/`) — cohérence dateFin ≥ dateDebut,
  exigences par `type` (heures/cachets pour intermittence, montantHT+nbJours pour
  freelance), conversion `nbCachets → heures` via `Config.heuresParCachet`. 9 tests.
- DTO : `CreateMissionDto`, `UpdateMissionDto` (tout optionnel), `QueryMissionsDto`
  (filtres `type`/`statut`).
- `MissionsService` : `create`/`findAll`/`findOne`/`update`/`remove`. `update` fusionne
  l'existant avec le DTO avant de revalider (permet un `PATCH` partiel cohérent).
  `remove` s'appuie sur `onDelete: SetNull` — un document rattaché survit à la
  suppression de sa mission.
- `MissionsController` : `POST/GET/GET :id/PATCH :id/DELETE :id` sous `/api/missions`,
  protégés par le guard global (aucun `@Public()`).
- **26/26 tests verts**, lint propre.

**Corrigé — piège Docker récurrent, cette fois à la racine :** le conteneur backend
tournait en `root`, donc tout fichier écrit dans le bind-mount (`dist/` en mode watch)
devenait root-owned côté hôte et bloquait les builds locaux suivants. `Dockerfile` :
ajout de `USER node` (uid 1000, alpine officiel) avant l'entrée — même uid que
l'utilisateur hôte, donc plus aucun fichier root-owned. Nettoyage ponctuel fait via
`docker run --rm -v $(pwd):/app node:22-alpine rm -rf dist`.

**Vérifié en conditions réelles (Docker, au token JWT) :**

- Mission intermittence avec `nbCachets: 3` → `heures: 24` stocké (8h/cachet).
- Mission freelance complète → champs corrects, `heures`/`nbCachets` à `null`.
- Intermittence sans heures ni cachets → `400`. `dateFin < dateDebut` → `400`.
- Liste + filtre `?type=FREELANCE` corrects. Sans token → `401`.

**Prochaine étape :** module Dashboard (branche `calc/rolling-window.ts` sur les
missions réelles) — ou le frontend, selon ce que le propriétaire propose.

---

## 2026-09-01 — Module Auth

**Fait :**

- `argon2` (hash), `@nestjs/jwt`, `@nestjs/throttler` ajoutés. Le hash SHA-256
  provisoire du seed est remplacé par `argon2.hash`.
- `POST /api/auth/login` : email + mot de passe → JWT (`sub`, `email`), **expiration
  12 h** (validé par le propriétaire — priorité à ne pas se faire déconnecter pendant
  une démo). Message d'erreur générique `401 Identifiants invalides`, jamais de
  distinction email/mot de passe.
- `GET /api/auth/me` : renvoie l'utilisateur courant à partir du JWT.
- `JwtAuthGuard` **global** (`APP_GUARD`) : tout est protégé par défaut ; décorateur
  `@Public()` pour lever la protection (`/auth/login`, `/health`).
- `ThrottlerGuard` global (100 req/min par défaut) + `@Throttle` plus strict sur
  `/auth/login` (**5 essais/minute**).
- `src/auth/auth.service.spec.ts` : 3 tests (login OK, mauvais mot de passe, email
  inconnu → même message). Total **17/17 tests verts**, lint propre.
- `.env` : `JWT_SECRET` remplacé par une vraie valeur aléatoire (32 octets hex),
  générée localement, jamais commitée (`.env` est gitignoré).

**Vérifié en conditions réelles (Docker) :**

- `argon2` s'installe et fonctionne sans souci sous Alpine (prébuilt napi, pas de
  compilation native à gérer).
- Flux complet testé au `curl` : health public → `/me` sans token = 401 → login mauvais
  mot de passe = 401 → login correct = token → `/me` avec token = 200.
- Rate-limit vérifié : le 6ᵉ essai de login dans la minute renvoie bien `429`.

**Piège rencontré :** le compte démo seedé *avant* ce module portait encore le hash
SHA-256 provisoire (incompatible avec `argon2.verify`) — la ligne a dû être supprimée
et reseedée. **Point d'attention pour la suite** : toute évolution du format de hash
exige un reset des comptes existants (non un souci en mono-utilisateur, mais à garder
en tête).

**Aussi :** un `dist/` généré par un run Docker antérieur appartenait à `root` sur
l'hôte (bind-mount) et bloquait `nest build` en local — nettoyé via un conteneur
Node jetable (`docker run --rm -v $(pwd):/app node:22-alpine rm -rf dist`).

**Prochaine étape :** module Missions (CRUD + filtres type/statut).

---

## 2026-09-01 — Socle applicatif (NestJS + Prisma + Docker)

**Fait :**

- `backend/` devient une vraie app NestJS 11 : `main.ts` (préfixe `/api`,
  `ValidationPipe` global, CORS), `AppModule`, `PrismaModule`/`PrismaService`
  (`@Global`), `HealthController` (`GET /api/health` → teste `SELECT 1`).
- `class-validator` + `class-transformer` ajoutés (requis par `ValidationPipe`).
- `prisma/schema.prisma` : les 5 modèles + 4 enums de `docs/02`. 1ʳᵉ migration
  `20260901114507_init` créée et appliquée.
- `prisma/seed.ts` : upsert `User` (depuis `SEED_USER_*`) + `Config` id=1. Hash
  provisoire SHA-256 — **sera remplacé par argon2 à l'étape Auth**.
- Docker : `backend/Dockerfile` (dev, hot-reload), `backend/docker-entrypoint.sh`
  (`prisma migrate deploy` + seed puis `nest start --watch`),
  `docker-compose.yml` racine (db Postgres 16 + backend), `.dockerignore`.
- `.env.example` + `.env` (ports Synapse : backend `4001`, db `5433`, front `4000`).
- `README.md` racine : lancement en une commande (`docker compose up -d --build`).
- `.github/workflows/ci.yml` : `npm ci` + `prisma generate` + `lint:ci` + `npm test`.
- `eslint.config.mjs` (flat config, eslint 9).

**Vérifié :**

- `docker compose up -d --build` → migrations + seed automatiques → API up.
- `curl localhost:4001/api/health` → `{"status":"ok","db":"up"}`.
- Route inconnue → 404. `npm run lint:ci` → 0 erreur. `npm test` → 14/14.

**Pièges rencontrés (documentés dans le README) :**

- Le volume anonyme `/app/node_modules` masque les nouvelles deps après un simple
  `--build` → utiliser `--renew-anon-volumes`.
- Le bind-mount `./backend:/app` masque le `chmod +x` de l'image → l'entrypoint est
  invoqué via `sh ./docker-entrypoint.sh` et le fichier est exécutable côté hôte.

**Prochaine étape :** module Auth (argon2, `POST /auth/login`, guard JWT global,
throttler) — validé « après » par le propriétaire, donc c'est le moment.

**État Docker :** la stack tourne (`docker compose ps` pour vérifier).

---

## 2026-09-01 — Règle des 12 mois glissants : spec + calcul + tests

**Fait :**

- `docs/04-regle-12-mois-glissants.md` : spécification de référence (contrat de la
  fonction pure, définition de la fenêtre **alignée sur les mois**, éligibilité,
  formules des 3 indicateurs, 12 cas de test).
- Fenêtre retenue : les `dureeFenetreMois` mois calendaires qui se terminent avec le
  mois de `dateRef`. `borneDebut` = 1er jour du mois de départ. Alternative « au jour
  près » écartée (mois partiel → incohérence graphe/jauge).
- `backend/` amorcé : `package.json` (TS + Jest + ts-jest), `tsconfig.json`,
  `jest.config.js`. **Pas encore NestJS** — le calcul est volontairement autonome.
- `backend/src/calc/rolling-window.ts` : fonction pure `calculerIndicateurs(missions,
  config, dateRef)`. Zéro import `@nestjs/*` ou `@prisma/client`. Tout en UTC.
- `backend/src/calc/rolling-window.spec.ts` : **14 tests, tous verts** (12 cas de la
  spec + tri/couverture de `caParMois` + non-mutation des entrées).
- `.gitignore` racine ajouté.

**Prochaine étape :** amorcer l'app NestJS réelle + schéma Prisma + `docker-compose.yml`
dev, et obtenir un `docker compose up` fonctionnel (socle du mardi).

---

## 2026-09-01 — Modèle de données

**Fait :**

- `docs/02-modele-de-donnees.md` rédigé et validé (« je te fais confiance »).
- 5 entités : `User` (1 ligne), `Config` (1 ligne, id=1), `Mission`, `Document`,
  `Projet`. 4 enums. Détails et règles de validation dans le doc.
- Tranché : table `Mission` unique avec champs nullables selon `type` (validation DTO) ;
  `heures` = source de vérité du calcul, `nbCachets` optionnel reconverti au save ;
  dates en `@db.Date` ; `Config` singleton via `PATCH` ; `Document.stockageNom` = UUID
  disque ; `onDelete: SetNull` mission→documents ; pas de soft-delete ni d'audit.
- `lienVideo` du `Projet` : **obligatoire au MVP** ; projet sans vidéo = roadmap.

**Prochaine étape :** spécification + tests de la règle des 12 mois glissants
(`docs/04-regle-12-mois-glissants.md` + `backend/src/calc/`).

---

## 2026-09-01 — Cadrage & décisions d'architecture

**Fait :**

- Lecture du brief. Décision : on fait le build complet (app + déploiement + dossier),
  solo.
- `docs/01-note-de-cadrage.md` rédigé (note de cadrage v1) : reformulation du besoin,
  périmètre retenu (MVP A–E + Paramètres), périmètre écarté, 8 hypothèses (H1–H8),
  questions client Q1–Q5 avec réponses par défaut.
- Décisions de stack et d'architecture actées — voir `AGENTS.md` §3 :
  - stack reprise de `Synapse-CRM` (NestJS + Prisma + PostgreSQL / Next.js + shadcn /
    Docker / JWT), version allégée (pas de WebSocket, mail, multi-rôles, GHCR, préprod).
  - module différenciant = export `.ics` + `.csv`.
  - auth = email + mot de passe (`argon2`), JWT `localStorage`, throttler login, guard
    global. Magic link + cookie httpOnly → roadmap.
  - déploiement = VPS perso (nginx + certbot déjà en place), `docker-compose.prod.yml`
    + script SSH. CI = lint + test seulement.
  - sous-domaine : décidé au déploiement (domaine perso ou `desec.io` pour tests).
- Créé : `AGENTS.md`, `CLAUDE.md` (pointeur), `docs/journal-de-bord.md`.
- Dépôt git initialisé dans `/home/zera/cadre`.

**Prochaine étape :** modèle de données détaillé (`docs/02-modele-de-donnees.md`).

**En attente / à confirmer avec le client (RDV jeudi) :** réponses Q1–Q5, nom
définitif de l'outil, sous-domaine de déploiement.
