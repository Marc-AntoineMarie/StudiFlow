# Cadré

Outil privé pour un monteur vidéo indépendant qui alterne **intermittence du
spectacle** (heures déclarées, seuil des 507 h sur 12 mois glissants) et **freelance**
(jours facturés, chiffre d'affaires). L'outil rend cette distinction lisible :
missions et calendrier, tableau de bord, documents, portfolio.

> Documentation de reprise complète : [`AGENTS.md`](./AGENTS.md).
> Dossier technique : [`docs/`](./docs/).

## Fonctionnalités

- **Missions** : CRUD, vue mois / liste / timeline, filtres type + statut + recherche,
  distinction visuelle intermittence (bleu) / freelance (or).
- **Tableau de bord** : jauge des heures d'intermittence (12 mois glissants), CA
  freelance par mois, répartition intermittence/freelance, panneau de rappels
  d'échéance.
- **Documents** : dépôt (PDF/image, 10 Mo max), catégories, rattachement à une
  mission ou dépôt global, filtres de recherche dédiés, téléchargement, suppression.
- **Portfolio** : fiches projet (lien YouTube/Vimeo, lecteur intégré), filtres,
  tri.
- **Paramètres** : seuil, fenêtre glissante, journée type, heures/cachet — jamais
  codés en dur.
- **Export** (module différenciant) : calendrier `.ics`, missions `.csv`.
- **Récapitulatif PDF** d'une mission.
- **Thème clair / sombre**, mémorisé par appareil.
- Authentification par compte unique (JWT), rien d'accessible sans connexion.

## Stack

| | |
|---|---|
| Backend | NestJS 11 · Prisma 6 · PostgreSQL 16 · JWT (argon2) |
| Frontend | Next.js 15 (App Router) · Tailwind · composants faits main |
| Infra | Docker Compose · déploiement VPS (nginx + certbot) |

## Lancer en local

Prérequis : Docker + Docker Compose.

```bash
cp .env.example .env          # ajuster si besoin
docker compose up -d --build  # db + backend + frontend ; migrations + seed automatiques
```

- Application : <http://localhost:4000> (redirige vers `/login`)
- API : <http://localhost:4001/api>
- Santé : <http://localhost:4001/api/health> → `{"status":"ok","db":"up"}`
- PostgreSQL : `localhost:5433` (user `cadre` / db `cadre`)
- Compte de démonstration : `demo@cadre.local` / `demo-cadre-2026`

## Commandes utiles

```bash
docker compose logs -f backend                        # logs
docker compose exec backend npm test                  # tests unitaires backend
docker compose exec backend npx prisma migrate dev     # nouvelle migration après modif du schema
docker compose exec backend npm run seed               # re-seed User + Config (n'écrase pas le mot de passe existant)
docker compose down                                     # arrêt (les volumes db_data / uploads persistent)
```

> Après avoir modifié les dépendances d'un `package.json` (backend ou frontend),
> recréer les volumes anonymes : `docker compose up -d --build --renew-anon-volumes`.
> Sinon la nouvelle dépendance reste invisible du conteneur malgré l'image reconstruite.

### Mot de passe oublié

Mono-utilisateur, pas de flux "mot de passe oublié" par e-mail (choix de cadrage,
cf. `docs/01-note-de-cadrage.md`). Réinitialisation via un script exécuté sur le
serveur :

```bash
docker compose exec backend npm run reset-password -- "nouveau-mot-de-passe"
```

## Tests

Le cœur métier (règle des 12 mois glissants, validations de mission, rappels,
export ICS/CSV, PDF, config) est composé de fonctions testées isolément.
76+ tests backend. Spécification de la règle centrale :
[`docs/04-regle-12-mois-glissants.md`](./docs/04-regle-12-mois-glissants.md).

```bash
cd backend && npm install && npm test    # backend
cd frontend && npm install && npm run lint && npm run build   # frontend
```
