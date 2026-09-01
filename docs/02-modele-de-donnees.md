# Modèle de données

> Partie du dossier technique (spécifications techniques, partie c).
> Dernière mise à jour : 2026-09-01.

## Vue d'ensemble

Cinq entités. Volume attendu très faible (un seul utilisateur, quelques dizaines de
missions par an). Pas de polymorphisme, pas de soft-delete, pas d'audit log : non
demandés par le brief, écartés volontairement.

```
User        (1 ligne)      — authentification
Config      (1 ligne)      — paramètres métier configurables
Mission     (0..n)         — cœur du produit
Document    (0..n)         — rattaché à 0 ou 1 mission
Projet      (0..n)         — portfolio
```

Relations :

- `Mission (1) ──< Document (0..n)` — une mission a zéro, un ou plusieurs documents.
- `Document.missionId` est **nullable** — un document peut ne dépendre d'aucune mission.
- Suppression d'une mission → `onDelete: SetNull` sur ses documents : le fichier est
  conservé, il devient « global ».
- `User` et `Config` n'ont aucune relation (tables autonomes à une ligne).

## Enums

| Enum | Valeurs | Note |
|---|---|---|
| `TypeMission` | `INTERMITTENCE`, `FREELANCE` | Détermine quels champs sont requis. |
| `StatutMission` | `PROPOSEE`, `CONFIRMEE`, `TERMINEE` | Seuls `CONFIRMEE` + `TERMINEE` entrent dans le calcul des 12 mois glissants. |
| `CategorieDocument` | `CONTRAT`, `ATTESTATION_EMPLOYEUR`, `DEVIS`, `FACTURE`, `AUTRE` | Reprend le brief. |
| `TagProjet` | `PRO`, `PERSO` | Filtre du portfolio. |

## Entités

### User

| Champ | Type | Contraintes |
|---|---|---|
| `id` | Int | PK, autoincrement |
| `email` | String | unique |
| `passwordHash` | String | hash `argon2`, jamais le mot de passe en clair |
| `createdAt` | DateTime | défaut `now()` |

Une seule ligne en pratique (mono-utilisateur). Créée au démarrage par le seed si
absente, à partir de `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` (variables d'env).
Pas d'inscription publique, pas de route de création de compte.

### Config

Paramètres métier. **Aucune de ces valeurs n'est codée en dur dans la logique** : le
calcul lit toujours cette table.

| Champ | Type | Défaut | Sens |
|---|---|---|---|
| `id` | Int | `1` | Singleton : toujours id = 1. |
| `seuilHeures` | Int | `507` | Seuil de référence d'heures d'intermittence sur la fenêtre. |
| `dureeFenetreMois` | Int | `12` | Largeur de la fenêtre glissante, en mois. |
| `journeeTypeHeures` | Float | `8` | Conversion jours → heures (freelance, et affichage). |
| `heuresParCachet` | Float | `8` | Conversion cachets → heures (intermittence). |
| `updatedAt` | DateTime | `@updatedAt` | |

Accès : `GET /parametres` (lecture), `PATCH /parametres` (mise à jour partielle).
Le seed garantit la présence de la ligne id = 1 avec les valeurs par défaut.

### Mission

| Champ | Type | Requis | Sens |
|---|---|---|---|
| `id` | Int | — | PK |
| `titre` | String | oui | Intitulé court de la mission. |
| `clientOuProduction` | String | oui | Nom du client (freelance) ou de la production (intermittence). |
| `type` | `TypeMission` | oui | `INTERMITTENCE` ou `FREELANCE`. |
| `statut` | `StatutMission` | oui, défaut `PROPOSEE` | |
| `dateDebut` | Date | oui | Jour de début (sans heure, `@db.Date`). |
| `dateFin` | Date | oui | Jour de fin. **Date de rattachement pour tous les calculs.** Peut être = `dateDebut`. |
| `note` | String? | non | Note libre. |
| `heures` | Float? | requis si `INTERMITTENCE` | **Source de vérité** du cumul d'heures. |
| `nbCachets` | Float? | non | Si fourni à la saisie : `heures` est (re)calculé = `nbCachets × Config.heuresParCachet` au moment du save. Conservé pour l'affichage/l'édition. |
| `montantHT` | Float? | requis si `FREELANCE` | Montant hors taxes de la prestation. |
| `nbJours` | Float? | requis si `FREELANCE` | Nombre de jours facturés. |
| `createdAt` / `updatedAt` | DateTime | — | |

**Règles de validation (DTO) :**

- `type = INTERMITTENCE` → `heures` **ou** `nbCachets` requis ; `montantHT` / `nbJours`
  ignorés (mis à `null`).
- `type = FREELANCE` → `montantHT` **et** `nbJours` requis ; `heures` / `nbCachets`
  ignorés (mis à `null`).
- `dateFin >= dateDebut`.
- Les chevauchements de dates entre missions sont **autorisés** (fréquents dans le
  métier), jamais bloqués.

### Document

| Champ | Type | Requis | Sens |
|---|---|---|---|
| `id` | Int | — | PK |
| `nomFichier` | String | oui | Nom d'origine du fichier, pour l'affichage et le téléchargement. |
| `stockageNom` | String | oui, unique | Nom réel sur le disque = UUID v4 + extension. Empêche collisions et *path traversal*. |
| `mimeType` | String | oui | Vérifié à l'upload. Autorisés : `application/pdf`, `image/png`, `image/jpeg`, `image/webp`. |
| `tailleOctets` | Int | oui | Limite **10 Mo**. Rejet `413` au-delà. |
| `categorie` | `CategorieDocument` | oui | |
| `missionId` | Int? | non | `null` = document global. |
| `createdAt` | DateTime | — | |

**Stockage :** fichiers écrits dans un dossier monté sur volume (dev et prod), p. ex.
`/app/uploads/`. La base ne stocke que les métadonnées + `stockageNom`. Le
téléchargement passe par `GET /documents/:id/download`, **authentifié** ; aucun fichier
n'est exposé en statique public. Abstraction `StorageService` pour permettre un
remplacement par S3 (roadmap).

### Projet

| Champ | Type | Requis | Sens |
|---|---|---|---|
| `id` | Int | — | PK |
| `titre` | String | oui | |
| `description` | String | oui | |
| `tag` | `TagProjet` | oui | `PRO` ou `PERSO`. |
| `date` | Date | oui | Date du projet. |
| `lienVideo` | String | **oui (MVP)** | URL YouTube ou Vimeo. L'URL d'embed est dérivée côté front. Projet sans vidéo (upload direct) = roadmap. |
| `createdAt` / `updatedAt` | DateTime | — | |

**Validation :** `lienVideo` doit matcher un domaine YouTube ou Vimeo reconnu ; sinon
rejet.

## Ce qui est volontairement absent

| Absent | Raison |
|---|---|
| Table d'historique / audit des modifications | Non demandé par le brief (bloc A = « note libre » + statut). |
| Soft-delete (`deletedAt`) | Suppression réelle suffisante au périmètre. |
| Table `Client` / `Production` séparée | Un simple champ texte suffit ; pas de gestion de référentiel client au MVP. |
| Rôles / permissions | Mono-utilisateur explicite. |
| Champ `heuresParJour` sur la mission | La conversion vit dans `Config`, pas sur la ligne. |

## Migrations & seed

- Chaque évolution de schéma → `prisma migrate dev --name <desc>` → fichier de
  migration versionné et commité.
- Seed (`prisma/seed`) : crée `User` (depuis env) si absent, crée `Config` id = 1 si
  absente. Le jeu de données de démo (~20 missions sur 14 mois, quelques documents,
  quelques projets) est un seed distinct, documenté à part.
