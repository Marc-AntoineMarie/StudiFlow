# AGENTS.md — Cadré

> Fichier de reprise pour un assistant IA (ou un développeur) qui arrive sur le projet
> sans contexte. Lire ce fichier en entier avant de toucher au code.
> Tenu à jour à chaque session. Dernière mise à jour : 2026-09-01.

`CLAUDE.md` à la racine pointe vers ce fichier.

---

## 1. Ce qu'est le projet

**Cadré** (nom de travail, non figé) est l'outil livré pour le *Workshop client 2* du
M1 Développeur Full Stack (MyDigitalSchool).

**Client** : un monteur vidéo indépendant qui alterne deux régimes d'activité qui **ne
se comptent pas de la même manière** :

- **Intermittence du spectacle** → heures déclarées, seuil glissant de référence
  **507 h sur 12 mois glissants**.
- **Freelance** → jours facturés + chiffre d'affaires HT.

Le problème du client est **organisationnel** : il ne sait pas où il en est de ses
heures, il retrouve mal ses documents, ses projets vidéo « dorment sur un disque dur ».

**Le cœur du produit = le calcul des 12 mois glissants.** Le calendrier, les documents
et le portfolio sont des moyens au service de cette clarté.

Brief complet : `M1DFS_Workshop_Brief.pdf` (hors dépôt, fourni par l'école).
Note de cadrage détaillée : `docs/01-note-de-cadrage.md`.

---

## 2. État d'avancement

| Phase | État |
| --- | --- |
| Note de cadrage v1 | ✅ fait — `docs/01-note-de-cadrage.md` |
| Choix stack & archi | ✅ décidé (voir §4) — spec en cours dans `docs/03-specifications-techniques.md` |
| Modèle de données | ✅ fait — `docs/02-modele-de-donnees.md` |
| Spéc + tests règle 12 mois glissants | ✅ fait — `docs/04-regle-12-mois-glissants.md` + `backend/src/calc/` (14 tests verts) |
| Socle NestJS + Prisma + Docker Compose (dev) | ✅ fait — `docker compose up -d --build` → API + `/api/health` OK, migration `init` + seed |
| Module Auth (argon2, JWT, guard global, throttler) | ✅ fait — `POST /api/auth/login`, `GET /api/auth/me`, guard global, throttle login 5/min, JWT 12h |
| Module Missions (CRUD + filtres) | ✅ fait — validation par type, conversion cachets→heures |
| Module Dashboard (branche `calc/`) | ✅ fait — `GET /api/dashboard` |
| Direction artistique | ✅ **validée par le propriétaire** — `docs/06-direction-artistique.md` (Space Grotesk + Inter, lucide-react, palette sombre) |
| Frontend Next.js — socle + login | ✅ fait — testé bout en bout (Playwright), 0 erreur console |
| Frontend — vrai dashboard (jauge/aire/donut) | ✅ fait — 3 indicateurs du brief, données réelles, Recharts + anneau SVG maison |
| Frontend — page Missions (calendrier + liste + timeline + CRUD) | ✅ fait — testée bout en bout (Playwright), 0 erreur console |
| Layout partagé `(app)/layout.tsx` (nav + guard) | ✅ fait — factorisé depuis le dashboard |
| Module Documents (back + front) | ✅ fait — upload/liste/téléchargement/suppression + filtres de recherche dédiés |
| Module Portfolio (back + front) | ✅ fait — CRUD, validation lien YouTube/Vimeo, miniature + lecteur intégré |
| Correctif UI — `<select>` illisible en thème sombre | ✅ fait — `color-scheme: dark` global |
| Module Paramètres (back + front) | ✅ fait — `GET`/`PATCH /api/parametres`, formulaire dans la nav |
| Module différenciant (export ICS + CSV) | ✅ fait — protégé, testé (RFC 5545, RFC 4180), boutons sur la page Missions |
| Thème clair/sombre | ✅ fait — jetons de surface (pas juste une palette), bouton nav + login, persistance, anti-flash |
| Rappels d'échéance | ✅ fait — fin de contrat, document manquant, seuil d'heures ; panneau sur le Dashboard |
| PDF récapitulatif de mission | ✅ fait — `pdfkit`, bouton dans le dialog d'édition |
| Jeu de données démo (~20 missions / 14 mois) + 1er déploiement VPS | ⬜ à faire — **prochaine étape** |
| Dossier technique (5 parties) | 🟡 partie a faite, reste à écrire au fil de l'eau |

Journal détaillé des changements : `docs/journal-de-bord.md`.

---

## 3. Décisions déjà prises (ne pas re-discuter sans raison)

1. **Stack** : reprise (allégée) de la stack du projet `Synapse-CRM` que le
   propriétaire maîtrise — NestJS + Prisma + PostgreSQL / Next.js + shadcn/ui / Docker
   Compose / JWT. Référence en lecture seule : `/home/zera/Synapse-CRM`.
2. **Ne PAS reprendre de Synapse** : WebSocket/Socket.io, envoi de mails, multi-rôles,
   préprod séparée, registry GHCR. Trop lourd pour un build solo en ~4 jours.
3. **Module différenciant** : export `.ics` (calendrier) + `.csv` (missions). Choisi
   pour sa simplicité et sa fiabilité en démo. Les autres modules (upload vidéo,
   rappels d'échéance, PDF devis, page portfolio publique) sont en **roadmap**.
4. **Auth** : email + mot de passe, hash `argon2`, JWT (secret en env, expiration
   **12 h** — priorité à ne pas être déconnecté pendant une démo), rate-limit
   5/minute sur `/auth/login`, guard JWT **global**. Mono-utilisateur, pas
   de rôles, pas d'inscription publique. Token en `localStorage` + header `Bearer`
   pour l'instant ; cookie `httpOnly` = roadmap. Magic link écarté (dépendance mail en
   prod + friction démo jury) → roadmap.
5. **Sécurité "documents sensibles"** : factures / attestations / contrats sont de
   simples documents du bloc C ; ils sont protégés par le fait que **toute** route,
   téléchargement inclus, exige un JWT valide. Les fichiers ne sont jamais servis en
   statique public.
6. **Paramètres métier configurables, jamais en dur** : seuil (507 h), durée de la
   fenêtre (12 mois), journée type (8 h), heures par cachet (8). Stockés en base
   (table `Config`, une ligne), éditables via un écran Paramètres.
7. **Règle des 12 mois glissants** (résumé — spec complète à venir) :
   - une mission est rattachée à sa **date de fin** ;
   - elle compte si `dateFin ∈ [aujourd'hui − 12 mois ; aujourd'hui]`, **tout ou rien**,
     jamais de prorata ;
   - seuls les statuts `confirmée` et `terminée` comptent ; `proposée` s'affiche au
     calendrier mais ne compte pas ;
   - implémentée comme une **fonction pure** (`calc/`), sans Prisma ni Nest, testée
     unitairement (cas limites : mission à cheval sur la borne, mission `proposée`,
     année bissextile).
8. **Déploiement** : VPS personnel du propriétaire, nginx + certbot déjà en place.
   `docker-compose.prod.yml` à la racine (db sans port exposé + backend + frontend).
   Déploiement par script SSH (`git pull` → `docker compose up -d --build` →
   `prisma migrate deploy`). GitHub Actions = lint + test uniquement, pas de deploy
   auto au début. Sous-domaine choisi au moment du déploiement (domaine du
   propriétaire ou un `desec.io` pour les tests).
9. **Méthode de travail** : on avance par étapes validées ; le propriétaire valide
   chaque étape avant de passer à la suivante. **Frontend minimal** tant que le
   propriétaire n'a pas explicitement lancé la passe de design — priorité à « ça
   fonctionne et c'est testable ».

---

## 4. Architecture cible

### Monorepo

```text
cadre/
  backend/            NestJS
  frontend/           Next.js (App Router)
  docs/               dossier technique (Markdown, exporté en PDF au rendu)
  docker-compose.yml         dev
  docker-compose.prod.yml    prod (VPS)
  scripts/            deploy.sh, seed, etc.
  AGENTS.md  CLAUDE.md  README.md
```

### Modules backend (cible)

```text
backend/src/
  auth/          POST /auth/login, GET /auth/me, JwtAuthGuard global
  missions/      CRUD + filtres type/statut
  documents/     upload (multer, limite 10 Mo, pdf/png/jpg/webp), download authentifié,
                 catégorie, rattachement mission|global
  projets/       CRUD portfolio, validation lien vidéo YouTube/Vimeo → embed
  parametres/    Config (1 ligne) : seuil, fenêtre, journée type, heures/cachet
  dashboard/     3 indicateurs, consomme calc/
  calc/          rolling-window.ts — fonction PURE (missions[], config, dateRef) → indicateurs
  export/        GET /export/calendar.ics, GET /export/missions.csv
  prisma/        PrismaService
  common/        DTO, pipes, filtre d'exceptions, limites upload
```

### Écrans frontend (cible)

```text
frontend/app/
  login/
  (app)/
    dashboard/     3 indicateurs (jauge heures, CA/mois, répartition)
    missions/      vue liste + vue mois (grille 7 colonnes maison), filtres, dialog CRUD
    documents/     liste + filtres (mission / catégorie), upload, download, delete
    projets/       grille + filtre tag pro/perso, dialog, lecteur vidéo intégré
    parametres/    formulaire de configuration
frontend/lib/api.ts   client fetch + injection du token
```

---

## 5. Modèle de données (brouillon — à finaliser à l'étape suivante)

- `User` : id, email, passwordHash, createdAt. (une seule ligne en pratique)
- `Config` : id, seuilHeures=507, dureeFenetreMois=12, journeeTypeHeures=8,
  heuresParCachet=8, updatedAt. (une seule ligne)
- `Mission` : id, titre, clientOuProduction, type (`INTERMITTENCE` | `FREELANCE`),
  dateDebut, dateFin, statut (`PROPOSEE` | `CONFIRMEE` | `TERMINEE`), note,
  heures (nullable, si intermittence), nbCachets (nullable),
  montantHT (nullable, si freelance), nbJours (nullable, si freelance),
  createdAt, updatedAt.
- `Document` : id, nomFichier, cheminStockage, mimeType, tailleOctets,
  categorie (`CONTRAT` | `ATTESTATION_EMPLOYEUR` | `DEVIS` | `FACTURE` | `AUTRE`),
  missionId (nullable), createdAt.
- `Projet` : id, titre, description, tag (`PRO` | `PERSO`), date, lienVideo,
  createdAt, updatedAt.

Détails et contraintes : `docs/02-modele-de-donnees.md` (à créer).

---

## 6. Conventions

- Langue du domaine : **français** (noms de champs, enums, routes lisibles).
- Commits : messages courts en français, conventionnels (`type(scope): message`), un
  sujet par commit, découpage le plus fin possible sans jamais laisser un commit dans
  un état cassé. **Ne jamais commit sans l'accord explicite du propriétaire, à chaque
  fois** — ce n'est pas une pratique automatique, même après un commit précédent dans
  la même session. Pas de trailer `Co-Authored-By` (demande explicite).
- Backend : un module Nest par domaine, DTO + `class-validator`, pas de logique métier
  dans les contrôleurs. Le calcul 12 mois glissants reste **pur** et testé.
- Frontend : direction artistique validée le 2026-09-01 (`docs/06-direction-artistique.md`,
  Space Grotesk + Inter, lucide-react). Thème sombre **et clair** depuis le 2026-09-02
  (`data-theme` sur `<html>`, cf. `lib/theme.ts`) — composants faits main dans
  l'esprit shadcn/ui (pas de CLI exécutée). **Jamais** de `bg-white/N` ou `bg-black/N`
  codé en dur dans un composant : utiliser les jetons `--surface-1..4` / `--overlay*`
  définis dans `globals.css`, sinon le thème clair casse silencieusement (blanc à 5 %
  = blanc, donc invisible, sur fond déjà blanc).
- **Docker — tout volume (nommé ou anonyme) sur un chemin absent de l'image doit être
  pré-créé + `chown node:node` dans le `Dockerfile`, avant `USER node`.** Sinon Docker
  le seed root-owned au premier démarrage → `EACCES` à la première écriture (vécu 3
  fois : `dist/`, `.next/`, `uploads/`). Pour un volume **anonyme** déjà créé
  root-owned, `--renew-anon-volumes` suffit après correction de l'image ; pour un
  volume **nommé**, il faut le supprimer explicitement (`docker volume rm ...`) après
  correction. **Corollaire vécu une 4ᵉ fois** : `--renew-anon-volumes` est nécessaire
  après **tout** changement de `package.json` (nouvelle dépendance), pas seulement
  après un changement de `Dockerfile` — sinon `Cannot find module 'x'` malgré une
  image reconstruite qui contient bien la dépendance.
- Tout changement de schéma → migration Prisma versionnée + commit (avec l'accord du
  propriétaire, cf. ci-dessus).
- Toute fonctionnalité coupée → ligne dans `docs/05-roadmap.md`, pas de code mort.

---

## 7. Commandes

```bash
# Dev — une commande (migrations + seed automatiques via docker-entrypoint.sh)
cp .env.example .env
docker compose up -d --build
#   API        http://localhost:4001/api
#   Santé      http://localhost:4001/api/health
#   Postgres   localhost:5433  (user cadre / db cadre)

docker compose logs -f backend
docker compose exec backend npm test                 # tests unitaires (dont calc/)
docker compose exec backend npx prisma migrate dev   # nouvelle migration après modif du schema
docker compose exec backend npm run seed             # re-seed User + Config
docker compose down                                   # arrêt (volumes db_data / uploads conservés)

# Après modif de backend/package.json (nouvelles deps) :
docker compose up -d --build --renew-anon-volumes

# Sans Docker (tests only)
cd backend && npm install && npm test

# Prod (sur le VPS) — à écrire à l'étape déploiement
# ./scripts/deploy.sh
```

---

## 8. Pour reprendre le projet dans une nouvelle session

1. Lire ce fichier, puis `docs/journal-de-bord.md` (dernières entrées).
2. Vérifier le tableau d'avancement §2.
3. Les décisions §3 sont actées — ne pas les rouvrir sans raison explicite.
4. Le propriétaire travaille **par étapes validées** : proposer, attendre son accord,
   avancer d'un pas.
5. Skills mentionnés par le propriétaire pour plus tard : `graphify` (graphe de
   connaissance du code), passe de design frontend.
