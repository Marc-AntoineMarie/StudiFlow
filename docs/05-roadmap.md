# Roadmap

> Partie (e) du dossier technique. Évolutions envisagées mais volontairement écartées
> du MVP — coupées consciemment plutôt que codées à moitié (cf. `AGENTS.md` §3.9).
> Chaque ligne : ce que ça apporte au client + effort estimé (S = quelques heures,
> M = 1 à 2 jours, L = plus d'un sprint).
> Dernière mise à jour : 2026-09-01.

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

## Module différenciant — alternatives non retenues

Le groupe a choisi l'export `.ics`/`.csv` (simplicité, fiabilité en démo). Les autres
options du brief restent des évolutions naturelles :

| Évolution | Apport client | Effort |
|---|---|---|
| Upload vidéo direct (au lieu du lien YouTube/Vimeo) | Portfolio autonome, pas besoin d'un compte tiers | L — stockage volumineux, limite de taille, aperçu |
| Rappels d'échéance (fin de contrat, document manquant, seuil qui approche) | Réduit le risque d'oubli, cœur du problème initial du client | M — nécessite une notion de notification (mail ou in-app) |
| Génération PDF d'un devis / récapitulatif de mission | Valorise le travail, utile pour la partie freelance naissante | M |
| Page portfolio publique partageable sans connexion | Le client peut envoyer un lien à un prospect | M — nouvelle route publique, sélection des projets visibles |

## Hors périmètre du brief (rappel, ne pas coder)

Comptabilité/facturation complète, connexion France Travail, application mobile
native, multi-utilisateur, montage/transcodage vidéo, intégration Google Agenda — cf.
`docs/01-note-de-cadrage.md` §1.3.
