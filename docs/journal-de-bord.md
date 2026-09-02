# Journal de bord

Ordre chronologique inverse (le plus récent en haut). Une entrée par session ou par
lot de changements notable. Sert de fil de reprise et alimente le *Guide de reprise*
(dossier technique, partie d).

---

## 2026-09-02 — 3 retours utilisateur sur la vidéo hébergée (bug bloquant + 2 demandes)

Retours du propriétaire juste après la mise en place de la vidéo hébergée, tous
traités dans la foulée :

1. **Bug bloquant** : après avoir uploadé une vidéo hébergée en édition, impossible
   d'enregistrer le reste du formulaire — `lienVideo must be a URL address`. Cause :
   le payload envoyait `lienVideo: ''` (chaîne vide) quand la source vidéo était
   « hébergée », et `@IsOptional()` de class-validator ne saute la validation que
   pour `undefined`, pas `''` — `@IsUrl()` rejetait donc systématiquement. Corrigé
   des deux côtés : le frontend envoie `undefined` (la clé est omise du JSON) au
   lieu de `''`, et les DTOs (`CreateProjetDto`/`UpdateProjetDto`) transforment en
   plus toute chaîne vide en `undefined` avant validation (défense en profondeur,
   au cas où un futur appel reproduirait l'erreur).

2. **Upload dès la création** : il fallait auparavant enregistrer le projet avant
   de pouvoir y attacher une vidéo. `ProjetDialog` crée maintenant le projet à la
   volée (avec les champs déjà saisis) au premier envoi de fichier si aucun id
   n'existe encore, puis bascule en mode édition pour le reste de la session —
   sans ça, cliquer ensuite sur « Créer » aurait produit un doublon. Petit ajout :
   le bouton « Annuler » devient « Fermer » dans ce cas précis, pour ne pas laisser
   croire que la vidéo déjà envoyée serait annulée avec lui (elle est persistée
   immédiatement, comme les documents attachés à une mission).

3. **Miniature noire + pas de lecteur dans le fichier hors-ligne** : `<video
   preload="metadata">` comme vignette n'affiche pas toujours une image (dépend du
   navigateur/de l'encodage — confirmé en pratique). Remplacé par une vraie
   vignette générée côté serveur avec `ffmpeg -ss 1 -frames:v 1` (même convention
   que les miniatures PDF existantes, réutilise `cheminMiniature`/
   `miniatureExiste`/`supprimerMiniature` telles quelles). `ffmpeg` ajouté aux deux
   Dockerfiles (dev + prod). Nouvelles routes de lecture (mêmes règles d'accès que
   la vidéo elle-même) : `GET /projets/:id/video-thumbnail` (propriétaire,
   `?token=`) et `GET /portfolio-liens/:token/video-thumbnail/:projetId` (public,
   scoping vérifié). Conséquence directe : l'export `.html` hors-ligne embarque
   maintenant un vrai `<video controls>` avec cette vignette en poster, au lieu
   d'un simple lien « voir en ligne » — lecture directe dans le fichier, sans
   changer de page, dès que l'appareil a du réseau (vérifié en ouvrant le fichier
   généré en `file://` pur).

14 tests backend ajoutés (125 au total), lint + build frontend clean. Vérifié de
bout en bout avec Playwright + un vrai fichier `.mp4` généré via `ffmpeg`.

---

## 2026-09-02 — Upload et lecture de vidéo hébergée (portfolio)

Suite directe du lot précédent : le propriétaire a demandé de lever tout de suite
la limite actée (vidéo YouTube/Vimeo = jamais lisible hors-ligne) en ajoutant un
vrai système d'upload/lecture vidéo, plutôt que d'attendre — les deux sujets
étaient liés (idée retenue en roadmap quelques minutes plus tôt).

**Modèle** : `Projet.lienVideo` devient optionnel ; 4 nouveaux champs
(`videoStockageNom/videoNomFichier/videoMimeType/videoTailleOctets`), tous
optionnels. Lien externe et vidéo hébergée sont **mutuellement exclusifs** :
fixer l'un efface l'autre (fichier compris), géré dans `ProjetsService`.
Migration additive, aucune perte de données (`ALTER COLUMN lienVideo DROP NOT
NULL` + 4 `ADD COLUMN`).

**Stockage/streaming** : réutilise `StorageService` (déjà en place pour les
documents) + nouvelle méthode `streamerAvecRange()` — support des requêtes
`Range` HTTP (206 Partial Content), indispensable pour qu'un `<video>` puisse
« seek » sans tout charger. Vérifié directement en `curl` (200 sans Range, 206
avec `Range: bytes=0-999`, `Content-Range` correct).

**Sécurité — deux routes de lecture, deux portées différentes** (sujet posé par
le propriétaire plus tôt dans la session, appliqué ici concrètement) :
- `GET /api/projets/:id/video` (propriétaire connecté, prévisualisation dans
  l'app) — marquée `@Public()` mais avec vérification **manuelle** du JWT, passé
  en `?token=` : un `<video src="…">` ne peut pas poser de header
  `Authorization`, c'est le pattern standard pour ce cas. Vérifié : 401 sans
  token, 200/206 avec.
- `GET /api/portfolio-liens/:token/video/:projetId` (page publique) — scoping
  vérifié en base (`projetId` doit appartenir à `lien.projetIds`) : **404 même
  avec un lien valide** si le projet n'a pas été sélectionné pour CE lien. Même
  garantie que pour les données JSON du lien public.

**Bug trouvé et corrigé pendant la vérification** : `resoudrePublic()` (route
publique JSON) ne sélectionnait pas les 4 champs vidéo hébergée dans sa requête
Prisma — la page publique ne pouvait donc jamais savoir qu'un projet avait une
vidéo hébergée (bouton « Aperçu » toujours désactivé). Repéré en testant la
page publique de bout en bout, corrigé, revérifié.

**Frontend** : `ProjetDialog` — bascule Pill « Lien externe » / « Vidéo
hébergée », dropzone réutilisée (accept vidéo ajouté en prop), lecteur natif +
suppression dédiée. Vidéo indisponible tant que le projet n'est pas encore créé
(comme l'attache de documents à une mission). `ProjetCard` (app) et
`ProjetCardPublic` (page publique) : lecteur `<video>` natif à la place de
l'iframe YouTube/Vimeo quand une vidéo est hébergée ; miniature = 1ʳᵉ image via
`preload="metadata"` (pas de génération de vignette côté serveur pour l'instant,
noté en roadmap). Export hors-ligne : un projet à vidéo hébergée obtient un lien
« voir en ligne » vers le flux scoping-protégé au lieu du lien YouTube.

**Vérifié en conditions réelles**, pas juste en mocks : vrai fichier `.mp4`
généré via `ffmpeg` (installé ponctuellement dans le conteneur backend),
uploadé, lu avec vraie barre de progression et durée exacte dans l'app ET sur
la page publique, exclusivité mutuelle testée dans les deux sens (upload efface
le lien externe ; fixer un lien externe supprime le fichier hébergé — confirmé
sur le disque), suppression dédiée testée sans toucher au reste du projet.
11 tests backend ajoutés (119 au total), lint + build frontend clean.

---

## 2026-09-02 — Répartition par client, liaison documents/missions, timeline par année, indicateur de chargement, liens portfolio hors-ligne

Gros lot de retours utilisateur, traités étape par étape avec compte-rendu à
chaque fois (4 commits : `f523b73`, `2d08a0a`, `9b7690f`, et celui de cette
entrée).

**Dashboard — répartition par client** (`f523b73`) : fonction pure
`calculerRepartitionClients` (même fenêtre 12 mois glissants que le reste),
regroupe par `clientOuProduction`, top 5 + « Autres ». Toggle Activité (heures
équivalentes, cohérent avec la répartition intermittence/freelance existante) /
CA / Nb missions — demandé explicitement par le propriétaire après la première
proposition. 8 tests dédiés.

**Documents ↔ missions, liaison bidirectionnelle** (`2d08a0a`, puis étendu) :
`PATCH /api/documents/:id` pour (dé)rattacher un document existant. Mission
(édition) : bloc « Documents attachés » avec upload direct (même dropzone que
l'onglet Documents), aperçu au survol + clic, sélecteur élargi à **tous** les
documents (pas seulement le dépôt global — permet une réassignation directe
entre missions). Documents (table) : nom de mission cliquable (lien profond
`/missions?id=…`) + icône pour changer la mission liée sans quitter la page.
Rappels du dashboard cliquables → ouvrent la mission concernée ; les rappels
résolus disparaissent déjà seuls (recalcul en direct, pas de statut à gérer).
Bug signalé par le propriétaire (« ça ne s'ajoute pas ») non reproduit après
investigation (deux mécanismes testés en profondeur, fonctionnels) — probable
onglet resté ouvert avant un rechargement à chaud du serveur de dev.

Survol/vignette factorisé (`use-thumbnail-hover.ts` + `thumbnail-popover.tsx`),
`DocumentsTable` refactorisée dessus.

**Timeline par année** (`9b7690f`) : une seule année à la fois (année courante
par défaut), navigation ◀ ▶ identique à la vue Mois.

**Indicateur de chargement global** : toute requête `apiFetch`/`apiDownloadBlob`
alimente un compteur partagé (`loading-store.ts`) qui pilote une barre fine en
haut de page (`top-loading-bar.tsx`, style GitHub/YouTube) — un seul mécanisme
couvre à la fois les transitions de page et les actions plus lentes (export,
upload, PDF…), sans instrumenter chaque écran individuellement.

**Liens de partage portfolio (module différenciant, hors-ligne)** : nouveau
modèle `LienPortfolio` (`token` unique, `titre?`, `projetIds[]`, résolu à la
volée — un projet supprimé disparaît simplement de la sélection). Nouveau
module `portfolio-liens` : CRUD authentifié + une seule route publique
`GET /:token/public` (`@Public()`, throttlée), qui ne renvoie **que** les
projets choisis pour ce lien — jamais de mission/document/CA, par construction
de la requête (pas seulement par convention). Page publique dédiée
`/portfolio-public/[token]` (hors du groupe `(app)`, pas de garde JWT, pas de
nav privée). Bouton « Télécharger pour consultation hors-ligne » : génère côté
client un fichier `.html` autonome (CSS inline, miniatures YouTube embarquées
en `data:` URI) — vérifié en l'ouvrant en `file://` pur, sans serveur ni réseau
simulé. Limite actée avec le propriétaire : la vidéo elle-même ne peut jamais
se lire hors-ligne (streamée depuis YouTube/Vimeo) ; idée retenue en roadmap
d'un système d'upload/lecture vidéo interne pour lever cette limite plus tard
(`docs/05-roadmap.md`).

Portfolio (page) : mode sélection sur les cartes projet (coche visuelle, pas de
checkbox séparée), panneau « Liens de partage » (copier / ouvrir / supprimer —
suppression vérifiée : le lien public renvoie bien `404` ensuite).

Vérifié à chaque étape avec Playwright (création, affichage public, téléchargement
hors-ligne, suppression + révocation, non-régression). 107 tests backend,
lint + build frontend clean.

---

## 2026-09-02 — Renommage Studiflow + préparation du déploiement VPS

Le propriétaire a fourni l'adresse de déploiement : IP `148.113.207.25`, port SSH
`4025`, sous-domaine `studiflow.marc-antoinemarie.com`, avec deux contraintes
explicites : pas d'accès SSH complet donné à l'assistant IA (« le reste c'est moi qui
met »), et l'assistant ne touche **pas** à la config nginx en place lui-même (« tu
peux la vérifier et m'aider... mais certainement pas toucher à ma config nginx
toi-même »). Le sous-domaine reprenait le nom « StudioFlow » de la maquette de login
précédente — décision demandée et tranchée : le nom du produit est figé en
**Studiflow** (sans le second « o », cohérence avec le sous-domaine). Le nom de
travail « Cadré » reste seulement le nom du dépôt git et des identifiants internes
(base de données, `.env` de dev) pour ne pas casser l'historique.

**Renommage (UI + dossier) :**

- Titre d'onglet, nav, placeholder login, description `package.json`, log de
  démarrage backend : `Cadré` → `Studiflow`.
- `README.md`, `AGENTS.md`, `docs/01-note-de-cadrage.md`,
  `docs/06-direction-artistique.md` : nom affiché mis à jour, décision de figeage
  datée et tracée.

**Déploiement — fichiers préparés (respectant les deux contraintes ci-dessus, donc
rien exécuté sur le VPS lui-même) :**

- `backend/Dockerfile.prod`, `frontend/Dockerfile.prod` : images de production
  (build compilé, pas de bind-mount). Bug trouvé et corrigé en testant l'image
  backend : `nest build` sort dans `dist/src/main.js` (pas `dist/main.js`, à cause
  de `sourceRoot: "src"` dans `nest-cli.json`) — `CMD` du Dockerfile et
  `start:prod` du `package.json` corrigés.
- `docker-compose.prod.yml` : `db` + `backend` + `frontend`, ports backend/frontend
  publiés uniquement sur `127.0.0.1` (nginx = seul point d'entrée public).
- `deploy/nginx-studiflow.conf` : bloc nginx HTTP prêt à copier par le propriétaire
  (`/api/` → backend, `/` → frontend, `client_max_body_size 12m` pour les documents
  jusqu'à 10 Mo — le défaut nginx de 1 Mo les aurait bloqués avant même d'atteindre
  le backend). Fichier livré en commentaire de commandes à exécuter **par le
  propriétaire** ; l'assistant ne l'a pas appliqué.
- `.env.prod.example`, `scripts/deploy.sh` : gabarit de secrets de prod (à générer
  sur le serveur, jamais réutiliser ceux de dev) et script de mise à jour
  (`git pull` → rebuild → `prisma migrate deploy`), à lancer par le propriétaire.
- `frontend/.dockerignore`, `frontend/public/.gitkeep` (le projet n'avait pas de
  dossier `public/`, requis par le build `standalone` de Next.js).

**Validation locale avant remise au propriétaire** (l'assistant n'a pas accès au
VPS — seule vérification possible) : les deux `Dockerfile.prod` buildent proprement ;
un stack complet lancé avec des ports et identifiants jetables (`db` + `backend` +
`frontend`) a migré, seedé le compte de démo et répondu correctement sur
`/api/health`, `/api/auth/login` et `/login` (200). Stack de test entièrement
démonté après vérification (conteneurs, images, fichiers `.env`/`compose` jetables
supprimés) ; stack de dev (`cadre-*`, ports 4000/4001/5433) non touché.

Détail complet en `docs/03-specifications-techniques.md` §7.

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

## 2026-09-02 — Jeu de données de démo

Livrable du brief : « une vingtaine de missions sur 14 mois, quelques documents,
quelques projets ». `backend/prisma/seed-demo.ts` (`npm run seed:demo`) :

- **28 missions** curatées à la main (pas générées aléatoirement) sur 14 mois
  (juillet 2025 → septembre 2026), alternant intermittence (assistance vidéo Top 14,
  Champions Cup, Tournoi des 6 Nations — cohérent avec le profil du client du brief)
  et freelance (bandes-annonces, films corporate, publicités). Statuts variés
  (majorité Terminée, quelques Confirmée récentes/futures, une Proposée). Deux
  missions volontairement en chevauchement (6 Nations / teaser festival, 8-9 février)
  pour illustrer la règle « chevauchement autorisé ». Plusieurs missions avec un écart
  volontaire entre plage calendaire et jours facturés, pour exercer la nouvelle
  fonctionnalité de la note de cadrage (item 1 du retour utilisateur).
- **14 documents** : PDF générés à la volée (`pdfkit`) et passés par le pipeline de
  miniature réel (`pdftoppm`), répartis sur ~10 missions + 2 documents globaux —
  volontairement pas 100 % de couverture, pour que le panneau Rappels illustre le vrai
  problème du client (documents introuvables). Équilibré à 14/28 après un premier
  essai trop chargé (21 rappels sur 28 missions — corrigé pour rester lisible).
- **6 projets portfolio**, mélange Pro/Perso, `boiteProduction`/`clients` renseignés
  sur certains, vides sur d'autres (démontre le caractère optionnel).

**Résultat sur le dashboard réel** : 170 h cumulées / 507 h (34 %), 8 230 € de CA sur
12 mois glissants, répartition 57 % intermittence / 43 % freelance, 12 rappels actifs.
Vérifié en Playwright sur toutes les pages (mois/liste/timeline, dashboard, documents,
portfolio) : **0 erreur console**. Un premier contrôle des vignettes YouTube semblait
montrer des miniatures cassées — fausse alerte, c'était juste un temps d'attente trop
court avant la capture d'écran (confirmé : `img.complete === true`,
`naturalWidth: 480` sur les 5 miniatures une fois le réseau vraiment stabilisé).

Le seed **remplace** missions/documents/projets existants à chaque exécution (jamais
User ni Config) : rejouable sans risque pour repartir d'un état propre.

---

## 2026-09-02 — 4 retours utilisateur (calendrier, dashboard, documents, portfolio) + création de compte

Retours après un premier vrai test de bout en bout de l'app. Traités un par un,
compte-rendu donné avant chacun.

**1. Écart calendaire vs jours facturés.** Confusion légitime : une mission du 3 au
7 septembre (5 jours calendaires) peut ne facturer que 3 jours (week-end exclu). Le
dialog de mission affiche maintenant l'écart calendaire, une case à cocher « Exclure
les week-ends », et un message si le nombre de jours facturés diverge — informatif,
jamais bloquant (le week-end travaillé existe dans ce métier).

**2. Dashboard « qui ne bouge pas ».** Pas un bug : les missions de test avaient des
dates dans le futur, donc hors de la fenêtre des 12 mois glissants (règle du brief).
Révèle un vrai trou côté validation, corrigé : **impossible de marquer une mission
« Terminée » avec une date de fin dans le futur** — `mission-validation.ts` (backend,
avec `dateRef` injectée pour rester testable) + option désactivée côté frontend avec
correction automatique du statut si la date de fin recule dans le futur pendant
l'édition.

**3. Documents — vignette au survol + aperçu au clic.** `poppler-utils` (`pdftoppm`)
installé dans l'image Docker : à l'upload d'un PDF, la 1ʳᵉ page est rendue en PNG
(best-effort, jamais bloquant). Nouvelle route `GET /documents/:id/thumbnail`. Survol
d'une ligne → vignette flottante (mise en cache après le premier chargement). Clic sur
une ligne → fichier ouvert dans un nouvel onglet (`window.open` synchrone avant le
fetch, pour ne pas se faire bloquer comme pop-up) au lieu d'un téléchargement forcé.
**Vérifié avec un vrai PDF** (généré via LibreOffice headless, pas un fichier bidouillé
à la main) : la vignette rend fidèlement la page. Le clic-pour-ouvrir est confirmé à
100 % pour les images (aperçu natif du navigateur) ; pour les PDF le mécanisme est
identique mais le rendu inline n'a pas pu être vérifié dans l'environnement de test
headless (lecteur PDF non actif) — à confirmer par le propriétaire en conditions
réelles.

**4. Portfolio — boîte de prod et clients, optionnels.** Migration additive
(`boiteProduction String?`, `clients String[] @default([])`) — aucune donnée
existante perdue, vérifié. Composant réutilisable `TagInput` (ajout un par un,
chips retirables). Badges sur la carte projet uniquement si renseignés.

**Piège Docker (5ᵉ occurrence, nouvelle variante)** : `prisma migrate dev` a échoué
en `EACCES` sur `prisma/migrations/` — le dossier lui-même était root-owned depuis la
toute première migration (créée avant l'ajout de `USER node` dans le Dockerfile, bien
avant que la règle ne soit systématisée). Corrigé une fois pour toutes via un
conteneur jetable (`chown -R 1000:1000`). Contrairement aux cas précédents, ça ne se
reproduira pas : tous les fichiers du dépôt sont maintenant possédés par le bon
utilisateur.

**Panne matérielle** : l'ordinateur du propriétaire a crashé en cours de session. Les
conteneurs Docker sont tombés (redémarrés depuis, aucune perte : Postgres a son
propre volume, les fichiers de code n'ont jamais quitté le disque). 87 → 91 tests
backend toujours au vert après redémarrage.

**Création de compte initial.** Le propriétaire a fait remarquer, à raison, qu'un
client non-technique reprenant le projet n'a aujourd'hui aucun moyen de créer son
compte sans toucher à Docker/CLI — seul un compte seedé par variables d'env existe.
Ajouté `POST /api/auth/setup` (public, une seule fois : refuse dès qu'un compte
existe — `409`) et `GET /api/auth/setup-requise`. La page `/login` bascule
automatiquement entre « Créer votre compte » (base vide) et « Connexion » (compte déjà
présent). Ne rouvre pas la porte à une inscription publique multi-comptes : toujours
mono-utilisateur, juste plus accessible à la première mise en route. Testé de bout en
bout (création → connexion automatique → 2ᵉ tentative refusée en 409), y compris
visuellement (bascule de mismatch de confirmation, écran de création). Compte démo
restauré après test (`demo@cadre.local` / `demo-cadre-2026`, via le seed).

**91/91 tests backend.**

---

## 2026-09-02 — Audit de conformité au brief + récupération de mot de passe

Le propriétaire a demandé une relecture complète du brief contre ce qui est fait,
en pointant un manque probable : la récupération de mot de passe.

- **Vérifié plutôt que supposé** : la limite de 10 Mo sur l'upload de documents est
  bien gérée proprement (`413 Payload Too Large`, JSON propre, pas de crash) — testé
  avec un fichier de 11 Mo réel, pas juste lu dans le code.
- **Mot de passe oublié** : le brief ne l'exige pas explicitement, mais c'est un vrai
  trou pour un utilisateur unique. Une récupération par e-mail aurait réintroduit la
  dépendance mail écartée au cadrage (magic link refusé pour la même raison). Solution
  cohérente : `backend/prisma/reset-password.ts`, exécuté sur le serveur
  (`docker compose exec backend npm run reset-password -- "nouveau-mdp"`), documenté
  dans le README et `AGENTS.md`. Testé (ancien mot de passe rejeté, nouveau accepté,
  mot de passe démo restauré ensuite).
- **`README.md` remis à jour** : il datait du tout premier socle (« frontend à venir »
  alors qu'il est fait depuis longtemps). Reflète maintenant l'app réelle
  (fonctionnalités, stack, commandes, mot de passe oublié).
- **Gaps identifiés dans le dossier technique** (à combler avant vendredi) :
  spécifications fonctionnelles (partie b — user stories, captures d'écran) absentes
  en tant que document dédié ; guide de reprise formel (partie d) absent en tant que
  tel (`AGENTS.md` en couvre une partie, côté assistant IA, pas la version humaine
  attendue par le brief) ; export du dossier en PDF pas encore fait.

**Prochaine étape** : jeu de données de démo (~20 missions/14 mois) puis déploiement
VPS.

---

## 2026-09-02 — Thème clair/sombre, Rappels d'échéance, PDF récapitulatif

Trois demandes du propriétaire après avoir testé l'app : (1) les commits envoyés en
chat n'avaient pas été retrouvés/lancés — à refournir ; (2) un vrai **thème clair**,
l'app n'existant qu'en sombre ; (3) deux modules du brief non retenus au départ
(rappels d'échéance, génération PDF), demandés « en plus » du module différenciant
déjà livré (export ICS/CSV).

**Thème clair/sombre — plus qu'une palette.** Un premier passage n'aurait changé que
les variables de fond/texte, mais un grep a montré ~20 usages de `bg-white/N` et
`bg-black/N` codés en dur dans les composants (Input, Select, Button, Dialog, Pill,
calendrier, tableaux…) — un « blanc à 5 % » reste blanc, donc invisible, sur fond
clair. Introduit 6 jetons sémantiques (`--surface-1..4`, `--overlay`,
`--overlay-soft`) qui remplacent ces valeurs codées en dur partout, définis une fois
en sombre (`:root`) et une fois en clair (`:root[data-theme='light']`). `--accent-blue-light`
légèrement assombri en clair (utilisé comme texte, pas seulement décoratif — la
valeur sombre était trop pâle sur fond blanc). `color-scheme` bascule aussi, pour les
contrôles natifs (select, date picker).

Bascule et persistance : `lib/theme.ts` + `components/ui/theme-toggle.tsx`, bouton
soleil/lune dans la nav et sur la page login (hors du layout applicatif). Choix
mémorisé en `localStorage`, appliqué par un script inline dans `<head>` **avant** le
premier paint pour éviter un flash du thème sombre par défaut — `suppressHydrationWarning`
sur `<html>` pour ne pas faire remonter le désaccord SSR/client attendu par
construction sur ce pattern (le même que next-themes).

Vérifié en Playwright : bascule sombre→clair→sombre, persistance après navigation
entre pages, 0 erreur console (après le correctif `suppressHydrationWarning`).

**Rappels d'échéance** (`backend/src/rappels/`) : fonction pure `construireRappels`
combine missions + jauge du dashboard (réutilisation de `DashboardService`, exporté
depuis `DashboardModule`) pour produire 3 types d'alerte : fin de contrat confirmée
sous 14 jours, mission terminée sans document rattaché, seuil d'heures ≥ 90 %. 10
tests. Panneau dédié sur le Dashboard (`RappelsPanel`), état vide « tout est à jour ».

**PDF récapitulatif de mission** (`backend/src/missions/pdf-recapitulatif.ts`,
`pdfkit`) : `GET /api/missions/:id/recapitulatif.pdf`, protégé. Pas totalement une
fonction pure (effet = buffer binaire) mais isolée du reste de l'app. Tests limités à
la structure (signature `%PDF-`, taille non triviale) — un contenu PDF binaire ne se
prête pas à une assertion fine sans parseur dédié. Bouton « Récapitulatif PDF » dans
le dialog d'édition de mission (mode édition uniquement).

**76/76 tests backend.** Vérifié en conditions réelles (curl + Playwright) : rappel
« document manquant » correctement déclenché sur la mission démo `TERMINEE` sans
document ; PDF téléchargé reconnu comme document PDF valide par `file`.

**Piège Docker (4ᵉ occurrence, mais cette fois le bon réflexe a manqué)** : après
avoir ajouté `pdfkit` à `package.json`, le premier rebuild backend a été lancé sans
`--renew-anon-volumes` → `Cannot find module 'pdfkit'` malgré une image reconstruite
avec la dépendance. Corrigé en relançant avec le flag. Rappel à moi-même : **toujours**
`--renew-anon-volumes` après un changement de `package.json`, pas seulement après un
changement de `Dockerfile`.

**Commits** : toujours rien commité (le script donné en chat après le tour précédent
n'a pas été retrouvé/exécuté). Nouveau script complet redonné en chat pour tout le
travail non commité à ce jour — toujours à l'initiative du propriétaire, jamais
executé par Claude sans demande explicite à chaque fois.

**Périmètre différenciant du brief** : les 4 modules proposés en alternative à
l'export ICS/CSV sont maintenant tous couverts sauf l'upload vidéo direct et la page
portfolio publique (les deux plus coûteux, cf. `docs/05-roadmap.md`).

---

## 2026-09-01 — Paramètres + module différenciant (export ICS/CSV)

**Backend `parametres/`** : `GET /api/parametres`, `PATCH /api/parametres` sur la
ligne `Config` (id=1, singleton). Filet de sécurité : si la ligne est absente (ne
devrait jamais arriver, le seed la crée), `get()` la recrée avec les valeurs par
défaut plutôt que de planter. 3 tests.

**Backend `export/` (module différenciant du brief)** :

- `ics.ts` : génère un `.ics` (RFC 5545) en pur JS, sans dépendance externe.
  Point d'attention testé explicitement : `DTEND` d'un événement journée-entière est
  **exclusif** dans la RFC → toujours `dateFin + 1 jour`, y compris à cheval sur un
  changement de mois. Échappement des caractères spéciaux (`,` `;` retour ligne).
- `csv.ts` : génère un `.csv` avec **`;`** comme délimiteur (convention Excel en
  locale française, où `,` est déjà le séparateur décimal). Échappement RFC 4180.
- `export.controller.ts` : `GET /api/export/calendar.ics` et
  `GET /api/export/missions.csv`, tous deux **protégés** (comme le reste de l'API).
  Le CSV est préfixé d'un BOM UTF-8 pour qu'Excel détecte l'encodage (accents, €) —
  construit via `String.fromCharCode(0xfeff)` plutôt qu'un caractère littéral collé
  dans le fichier source (invisible, difficile à éditer/relire de façon fiable).
- 12 tests (`ics.spec.ts`, `csv.spec.ts`, `export.service.spec.ts`).
  **62/62 tests backend au total.**

**Frontend** :

- `(app)/parametres` : formulaire des 4 réglages, message de confirmation, ajouté à
  la nav partagée.
- Boutons **Export .ics** / **Export .csv** sur la page Missions (à côté de
  « Nouvelle mission »), même mécanique de téléchargement authentifié que les
  documents (`apiDownloadBlob` + lien synthétique).

**Vérifié en conditions réelles** :

- `curl` : `GET`/`PATCH /parametres` corrects ; `.ics` téléchargé contient bien
  `DTEND` = `dateFin + 1 jour` (`20260110` → `20260111`) ; `.csv` contient le BOM,
  le bon délimiteur, les bonnes colonnes ; les deux routes d'export → `401` sans
  token.
- Playwright : formulaire Paramètres → « Enregistrer » → confirmation affichée ;
  clic sur chaque bouton d'export → téléchargement déclenché avec le bon nom de
  fichier (`cadre-missions.ics` / `.csv`). 0 erreur console.

**MVP + module différenciant du brief entièrement couverts.** Restent : jeu de
données de démo réaliste (~20 missions/14 mois) et déploiement VPS — cf.
`docs/01-note-de-cadrage.md` §3.1 pour le récapitulatif du périmètre.

---

## 2026-09-01 — Portfolio (back + front) + retours sur Documents/Missions/UI

Retours du propriétaire sur ce qui était déjà en ligne, traités dans l'ordre :

**1. Bug UI — `<select>` illisible (options blanches sur fond blanc).** Cause :
sans indication contraire, le navigateur rend les contrôles natifs (liste
déroulante, sélecteur de date) avec son thème clair par défaut, même sur une page
sombre. Fix dans `globals.css` : `color-scheme: dark` sur `:root` (corrige tous les
contrôles natifs d'un coup) + une règle `select option { background/color }` en
filet de sécurité. Vérifié : `getComputedStyle` du select confirme `color-scheme:
dark` et un texte clair.

**2. Documents — pas de vrai moyen de « retrouver » un document.** Les sélecteurs
Catégorie/Mission de la carte d'upload ne servaient qu'au dépôt, pas à la recherche.
Ajout d'un second bloc **« Retrouver un document »**, séparé visuellement de
l'upload : pills de catégorie (multi-sélection), sélecteur de mission (« Toutes »,
« Dépôt global uniquement », ou une mission précise), recherche texte — tout en
`useMemo` client-side, cohérent avec le filtrage déjà en place sur Missions.

**3. Missions — nouvelle vue Timeline.** `components/missions/timeline-view.tsx` :
missions triées par date de début, groupées par mois, alignées sur une ligne
verticale avec un point coloré (bleu/or selon le type). Volontairement une timeline
**chronologique simple**, pas un Gantt à couloirs — répond à la demande telle quelle
sans sur-ingénierie ; un Gantt avec gestion des chevauchements en couloirs reste une
évolution possible si demandée (le calendrier mensuel affiche déjà les chevauchements
correctement).

**4. Module Portfolio — back + front, nouveau.**

- Backend `projets/` : CRUD complet, validation du lien vidéo dans
  `video-lien.ts` (fonction pure, testée seule — 9 cas) : accepte uniquement les
  domaines YouTube/Vimeo reconnus, rejette le reste en `400`. **Piège rencontré** :
  `ProjetsService.create` n'était pas déclarée `async` alors qu'elle lève une
  exception de manière synchrone avant tout `await` → le test
  `.rejects.toThrow(...)` ne l'attrapait pas (l'exception partait avant même la
  création de la Promise). Corrigé en ajoutant `async`. **50/50 tests backend.**
- Frontend `lib/video-embed.ts` : dérive l'URL d'embed (YouTube/Vimeo) et, pour
  YouTube uniquement, une miniature publique (`img.youtube.com`, aucun appel API).
  Pas de miniature simple pour Vimeo sans appel `oEmbed` — écarté pour rester simple,
  un dégradé + icône lecture sert de repli.
  `components/portfolio/projet-card.tsx` (miniature ou repli, bascule Aperçu = lecteur
  intégré en accordéon, pas une modale de plus), `projet-dialog.tsx` (formulaire
  création/édition/suppression, même schéma que `mission-dialog.tsx`).
- `(app)/portfolio` : filtres tag (Tous/Pro/Perso), recherche, tri par date,
  bouton « Ajouter un projet ».

**Vérifié en conditions réelles (Playwright)** : création d'un projet Perso avec un
lien `youtube.com/watch?v=...` depuis la vraie UI → apparaît avec sa miniature réelle
→ clic sur « Aperçu » → le lecteur intégré s'ouvre en accordéon. 0 erreur console.
Projets de test supprimés après vérification (un document nommé
`attestation_hebergement.pdf` trouvé dans la liste n'a **pas** été touché — pas la
trace d'un des scripts de test, probablement déposé par le propriétaire lui-même en
explorant l'app).

**MVP frontend quasi complet** : Missions, Dashboard, Documents, Portfolio sont
construits et validés un par un. Restent : écran Paramètres, module différenciant
(export ICS/CSV), jeu de données de démo réaliste, puis déploiement VPS.

---

## 2026-09-01 — Module Documents (upload, catégories, téléchargement) — back + front

**Backend :**

- `src/storage/storage.service.ts` (+ `storage.module.ts`) : abstraction disque —
  `enregistrer(buffer, nomOriginal)` écrit sous un nom **UUID** (anti-collision,
  anti path-traversal), `supprimer`, `cheminComplet`. Dossier lu depuis `UPLOAD_DIR`
  (défaut `./uploads`). Prête à être remplacée par un backend S3 (roadmap) sans
  toucher au reste du module.
- `documents/` : `POST /api/documents` (upload `multipart/form-data`, `FileInterceptor`
  en `memoryStorage`, limite **10 Mo**, whitelist MIME `pdf/png/jpeg/webp` vérifiée
  dans le service — message clair sinon), `GET /api/documents` (filtres `categorie` et
  `missionId` — `missionId=none` = dépôt global uniquement), `GET
  /api/documents/:id/download` (authentifié, nom d'origine restitué), `DELETE
  /api/documents/:id` (supprime le fichier disque **puis** la ligne).
- Un document rattaché à une mission passe `missionId → null` si la mission est
  supprimée (`onDelete: SetNull`, déjà dans le schéma) — jamais perdu.
- 7 tests (`documents.service.spec.ts`) : rejet sans fichier, rejet MIME interdit,
  rejet mission inexistante, création correcte, filtre `missionId="none"` vs
  numérique, suppression fichier+ligne, 404 sur suppression d'un document absent.
  **36/36 tests backend au total.**

**Piège Docker (même famille, sur un volume nommé cette fois) :** `uploads` est un
**volume nommé** (pas anonyme) dans `docker-compose.yml`. Comme `/app/uploads`
n'existait pas dans l'image avant, Docker l'a seedé **root-owned** au premier
`docker compose up`, avant même l'ajout du module Documents → upload en erreur
`EACCES` dès le premier essai réel. Contrairement à un volume anonyme, `--renew-anon-volumes`
n'y change rien : il a fallu supprimer explicitement le volume (`docker compose rm -f
backend && docker volume rm cadre_uploads`) après avoir corrigé le `Dockerfile`
(pré-création de `uploads/` + `chown` avant `USER node`, même pattern que `dist/` et
`.next/`). **Leçon generalisée dans `AGENTS.md`/README : tout volume (anonyme ou
nommé) sur un chemin absent de l'image doit être pré-créé + chown dans le Dockerfile
avant `USER node`.**

**Frontend :**

- `lib/api.ts` : `apiFetch` détecte un body `FormData` et laisse le navigateur poser
  le `Content-Type` multipart (sinon boundary manquant → échec silencieux) ; nouvelle
  fonction `apiDownloadBlob` pour les téléchargements authentifiés (le nom de fichier
  vient de l'objet déjà en mémoire côté client, pas d'un header `Content-Disposition`
  à exposer en CORS — plus simple).
- `components/documents/upload-dropzone.tsx` (drag&drop + sélection classique),
  `documents-table.tsx` (téléchargement déclenché via `Blob` + lien synthétique,
  suppression avec confirmation).
- `(app)/documents` : carte d'upload (catégorie + mission liée en sélecteurs),
  recherche client-side, table listant tous les documents.

**Vérifié en conditions réelles :**

- `curl` : upload PDF → 201 avec métadonnées correctes ; upload `.exe` → 400 ; liste ;
  téléchargement → contenu **identique** au fichier envoyé (`diff` sans écart) ; sans
  token → 401 ; suppression → 204 **et** fichier disparu du disque (vérifié dans le
  conteneur).
- Playwright : upload réel depuis la page → apparaît immédiatement dans la table avec
  la bonne catégorie, la bonne taille, « Dépôt global ». 0 erreur console. Document de
  test nettoyé après vérification.

**Prochaine étape :** en attente de validation du propriétaire, puis Portfolio
(dernière page du MVP frontend).

---

## 2026-09-01 — Page Missions (calendrier + liste + CRUD complet)

Le propriétaire a fourni 3 nouvelles maquettes (Missions calendrier/liste, Documents,
Portfolio — thème clair « StudioFlow ») à reskinner dans la direction validée. Il
demande une validation à chaque page. Missions d'abord (bloc A du brief, le plus
central). Couleur freelance tranchée : **or** (pas de vert, cohérent avec le CA du
dashboard) plutôt que de suivre la maquette à la lettre.

**Refactor au passage :** la nav + le guard d'auth (redirection si pas de token),
jusqu'ici dupliqués dans la page dashboard, sont extraits dans
`app/(app)/layout.tsx`, commun à toutes les pages protégées. Le dashboard n'a plus
besoin de son propre header ni de son check de token initial (garde le traitement du
401 sur le fetch comme filet de sécurité). Le login redirige maintenant vers
`/missions` (nouvelle page d'accueil post-connexion) plutôt que `/dashboard`, et
redirige lui-même vers `/missions` si un token est déjà présent.

**Nouveaux composants :**

- `components/ui/` : `Dialog` (modale faite main, fermeture Échap/clic-extérieur),
  `Select` (natif stylé), `Textarea`, `Pill` (toggle de filtre/formulaire).
- `components/missions/month-calendar.tsx` : grille calendrier maison (semaine
  commençant lundi, jours hors mois grisés mais missions débordantes toujours
  affichées, bouton « + » par jour, chips colorées bleu/or cliquables).
- `components/missions/missions-list.tsx` : table triable visuellement (titre,
  client, type, statut, dates, valeur).
- `components/missions/mission-dialog.tsx` : formulaire création/édition, toggle de
  type qui bascule les champs (heures/cachets ↔ montant HT/jours), suppression avec
  confirmation.
- `lib/types.ts`, `lib/mission-format.ts` : types partagés + libellés/couleurs des
  enums, réutilisables pour Documents/Projets plus tard.

**Page `(app)/missions`** : filtres Type/Statut (pills multi-sélection) + recherche
texte (client-side, sur titre/client/note), toggle vue Mois/Liste, navigation
mois précédent/suivant, bouton « Nouvelle mission » et clic sur une cellule vide
ouvrent le même dialog (pré-rempli à la bonne date en création).

**Vérifié en conditions réelles (Playwright)** : connexion → `/missions` → création
d'une mission freelance de 3 jours via une cellule du calendrier → apparaît bien sur
ses **3 jours** (pas de prorata visuel, cohérent avec la règle métier) → bascule vue
liste → les 3 missions s'affichent correctement. **0 erreur console.** Suppression
vérifiée directement en API (`DELETE` → 204, mission bien retirée). Donnée de test
nettoyée après vérification.

**Prochaine étape :** en attente de validation du propriétaire sur cette page, puis
Documents (upload, catégories) et Portfolio (fiches projet, lecteur vidéo intégré).

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
