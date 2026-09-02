# Roadmap

> Partie (e) du dossier technique. Évolutions envisagées mais volontairement écartées
> du MVP — coupées consciemment plutôt que codées à moitié (cf. `AGENTS.md` §3.9).
> Chaque ligne : ce que ça apporte au client + effort estimé (S = quelques heures,
> M = 1 à 2 jours, L = plus d'un sprint).
> Dernière mise à jour : 2026-09-02.

## Dashboard

| Évolution | Apport client | Effort |
|---|---|---|
| Section « indicateurs complémentaires » (progression mensuelle, missions en cours, équilibre en barre) | Vue plus riche que les 3 indicateurs imposés par le brief | M — nécessite de nouveaux champs/agrégats (tendance mensuelle, comptage de missions en cours) |
| Paramètres avancés en config (au-delà du seuil/fenêtre déjà configurables) | Personnalisation plus fine | S |

## Authentification

| Évolution | Apport client | Effort |
|---|---|---|
| Cookie `httpOnly` au lieu de `localStorage` | Durcissement contre le vol de jeton par XSS | S |
| Connexion sans mot de passe (magic link) | Confort, plus « moderne » | M — nécessite un service mail fiable en prod ; écarté au cadrage pour la démo (cf. `docs/01-note-de-cadrage.md`) |

## Stockage & documents

| Évolution | Apport client | Effort |
|---|---|---|
| Bascule vers un stockage S3-compatible | Portabilité, pas de dépendance au disque du serveur | S — `StorageService` déjà abstrait pour ça |

## Module différenciant — alternatives du brief

Le groupe a choisi l'export `.ics`/`.csv` comme module différenciant officiel
(simplicité, fiabilité en démo). Deux des autres options du brief ont finalement été
demandées par le propriétaire **en plus**, et sont faites (2026-09-02) :

- ✅ **Rappels d'échéance** (fin de contrat, document manquant, seuil qui approche) —
  `backend/src/rappels/`, panneau sur le Dashboard.
- ✅ **Génération PDF d'un récapitulatif de mission** — `pdfkit`, bouton dans le
  dialog d'édition d'une mission. *(Un « devis » à proprement parler demanderait des
  champs hors modèle actuel — lignes de facturation, prix unitaires — non couvert :
  seul le récapitulatif de mission, qui s'appuie sur les données déjà saisies, a été
  fait.)*

Restent en roadmap :

| Évolution | Apport client | Effort |
|---|---|---|
| Upload vidéo direct (au lieu du lien YouTube/Vimeo) | Portfolio autonome, pas besoin d'un compte tiers | L — stockage volumineux, limite de taille, aperçu |
| Page portfolio publique partageable sans connexion | Le client peut envoyer un lien à un prospect | M — nouvelle route publique, sélection des projets visibles |
| Génération PDF d'un vrai devis (lignes, prix unitaires, TVA) | Couvre la partie freelance au-delà du simple récapitulatif | M — nouveau modèle de données |
| Notification des rappels par e-mail (au lieu d'un panneau in-app uniquement) | Visibilité même sans ouvrir l'app | M — nécessite un service mail fiable en prod |

## Hors périmètre du brief (rappel, ne pas coder)

Comptabilité/facturation complète, connexion France Travail, application mobile
native, multi-utilisateur, montage/transcodage vidéo, intégration Google Agenda — cf.
`docs/01-note-de-cadrage.md` §1.3.
