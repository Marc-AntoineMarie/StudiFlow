# Note de cadrage — v1

> Workshop client 2 · M1 DFS · Monteur vidéo indépendant (intermittence + freelance)
> Nom de travail de l'outil : **Cadré** (provisoire, à confirmer)
> Rédacteur : équipe projet · Date : 01/09/2026

---

## 1. Contexte

Le client est monteur vidéo depuis ~3 ans (publicités, bandes-annonces, assistance
vidéo sur des matchs de rugby). Son activité relève surtout de l'**intermittence du
spectacle** (contrats courts, heures déclarées) ; il veut développer la part
**freelance** (prestations facturées).

Son problème est **organisationnel, pas technique** : il ne sait pas où il en est de
ses heures d'intermittence, il retrouve mal ses contrats / attestations / factures, et
ses projets vidéo « dorment sur un disque dur ». Cela s'est déjà traduit par des heures
mal comptées et des documents introuvables au moment voulu.

Le besoin n'est pas formalisé : intuition d'« un outil pour gérer calendrier, documents
et projets ». Notre travail est d'en faire un périmètre clair, défendable et réalisable
en 4,5 jours.

## 2. Problématique retenue

Permettre à un monteur qui alterne **deux régimes qui ne se comptent pas de la même
manière** de savoir à tout moment où il en est, de retrouver un document en quelques
secondes, et de valoriser son travail — sans changer ses habitudes.

- **Intermittence** → heures déclarées, seuil glissant de référence **507 h sur 12 mois**.
- **Freelance** → jours facturés + chiffre d'affaires HT.

Le calendrier, les documents et le portfolio sont des **moyens** au service de cette
clarté. Le cœur du produit est le **calcul des 12 mois glissants**.

## 3. Périmètre retenu

### 3.1 MVP (obligatoire)

| Bloc | Ce que le client peut faire |
|---|---|
| **A. Missions & calendrier** | Créer / modifier / supprimer une mission (client ou production, dates, type intermittence **ou** freelance, heures pour l'intermittence, montant HT + nb jours pour le freelance, statut `proposée`/`confirmée`/`terminée`, note libre). Vue **mois** + vue **liste**, filtres par type et par statut. Distinction intermittence / freelance visible au premier coup d'œil (**couleur + badge**). |
| **B. Tableau de bord** | En un écran, **3 indicateurs** : (1) jauge des heures d'intermittence cumulées sur 12 mois glissants vs seuil ; (2) CA freelance par mois ; (3) répartition du temps entre les deux régimes. |
| **C. Documents** | Déposer un fichier (PDF, image) rattaché à une mission **ou** global, lui donner une catégorie (`contrat`, `attestation_employeur`, `devis`, `facture`, `autre`), le retrouver par mission ou par catégorie, le télécharger, le supprimer. Stockage disque réel, limite de taille gérée proprement. |
| **D. Portfolio projets** | Créer une fiche projet (titre, description, tag `pro`/`perso`, date, lien vidéo YouTube/Vimeo affiché en lecteur intégré). Lister et filtrer. |
| **E. Authentification** | Se connecter avec un compte unique et sécurisé (JWT). Rien n'est accessible sans être connecté. Mono-utilisateur, pas de rôles, pas d'inscription publique. |
| **Paramètres** | Écran de configuration : seuil de référence (507 h), durée de la fenêtre (12 mois), journée type (8 h), heures par cachet (8). **Toutes ces valeurs vivent en base, aucune n'est codée en dur.** |

### 3.2 Module différenciant retenu

**Export du calendrier au format `.ics` et des missions au format `.csv`.**

Raison du choix : valeur réelle pour le client (réutilisable dans n'importe quel
agenda / tableur), effort maîtrisé, aucune dépendance lourde, démonstration simple et
fiable en soutenance. Écarte le risque d'une fonctionnalité à moitié codée (upload
vidéo notamment).

## 4. Périmètre écarté

Explicitement **hors périmètre** — noté ici et repris dans la roadmap, non codé :

- Comptabilité, paie, facturation complète, relances de paiement.
- Connexion aux services de France Travail (récupération automatique des heures).
- Application mobile native.
- Multi-utilisateur, gestion de rôles, partage de compte.
- Transcodage ou montage vidéo dans l'outil.
- Intégration / synchronisation Google Agenda.

**Autres modules différenciants non retenus** (candidats roadmap) :

- Upload vidéo direct.
- Rappels d'échéance (fin de contrat, document manquant, seuil qui approche).
- Génération PDF d'un devis ou d'un récapitulatif de mission.
- Page portfolio publique partageable par lien.

## 5. Hypothèses prises face aux zones floues

| # | Zone floue | Décision retenue |
|---|---|---|
| H1 | Mission d'intermittence à cheval sur la borne des 12 mois | **Pas de prorata.** Une mission est rattachée à sa **date de fin**. Elle compte si `dateFin ∈ [aujourd'hui − 12 mois ; aujourd'hui]`, sinon elle ne compte pas — en entier ou pas du tout. |
| H2 | Statuts pris en compte dans le cumul et la jauge | Seulement `confirmée` et `terminée`. Les missions `proposée` s'affichent au calendrier mais ne comptent pas. |
| H3 | « Heures ou cachets » pour l'intermittence | Saisie principale en **heures**. Champ optionnel « nombre de cachets » converti en heures via `heuresParCachet` (config, défaut 8). La valeur stockée et calculée est toujours en heures. |
| H4 | CA freelance « par mois » | Sur les **12 derniers mois glissants**. Chaque mission freelance est datée à sa `dateFin`. Restitution en barres mensuelles. |
| H5 | « Répartition du temps entre les deux régimes » | Sur les 12 mois glissants : heures d'intermittence vs (jours freelance × journée type) converties en heures. Restitution en proportion (donut / %). |
| H6 | Stockage des fichiers | Volume disque réel en dev **et** en prod (disque persistant de l'hébergeur). Limite **10 Mo par fichier**. Types acceptés : `pdf`, `png`, `jpg`/`jpeg`, `webp`. Rejet explicite au-delà. |
| H7 | Chevauchement de missions | Autorisé, jamais bloqué, affiché tel quel dans le calendrier et la liste. |
| H8 | Authentification | Un seul compte. Identifiants fournis par seed + variables d'environnement. Aucune route accessible hors `/login` sans jeton valide. |

## 6. Questions au client et réponses

Le client n'étant pas disponible en continu, les réponses ci-dessous sont les
**hypothèses actées par défaut** ; à confirmer au rendez-vous du jeudi matin.

| # | Question | Réponse retenue |
|---|---|---|
| Q1 | Mission à cheval sur la fenêtre des 12 mois : tout / rien / prorata ? Rattachée à quelle date ? | Rien de prorata. Tout ou rien selon la **date de fin** (cf. H1). |
| Q2 | « Répartition du temps entre régimes » : quoi exactement, sur quelle période ? | Heures intermittence vs jours freelance × journée type, sur 12 mois glissants (cf. H5). |
| Q3 | CA freelance « par mois » : 12 mois glissants ou année civile ? daté à quoi ? | 12 mois glissants, daté à la date de fin de mission (cf. H4). |
| Q4 | Un cachet = 8 h fixe, ou paramétrable ? | Paramétrable, défaut 8 h (cf. H3). |
| Q5 | Autres paramètres configurables que le seuil ? | Seuil + durée de fenêtre + journée type + heures par cachet (cf. §3.1 Paramètres). |

## 7. Contraintes de méthode

- **Déployer tôt** : un déploiement en ligne, même quasi vide, dès que possible.
- **Commencer par le calcul**, pas par l'interface : la règle des 12 mois glissants est
  spécifiée et testée unitairement avant toute UI (cas limites : mission à cheval sur
  la fenêtre, mission `proposée`, année bissextile).
- **Frontend minimal d'abord** : priorité à « ça fonctionne et c'est testable ».
  Le travail de design vient dans un second temps.
- **Couper** : toute fonctionnalité non commencée est documentée en roadmap plutôt que
  laissée à moitié codée.
- **Jeu de données de démo** = livrable : ~20 missions réparties sur 14 mois, quelques
  documents, quelques projets.

## 8. Prochaines étapes

1. Choix de stack et architecture (dossier technique, partie c).
2. Modèle de données : `User`, `Mission`, `Document`, `Projet`, `Config`.
3. Spécification détaillée et tests de la règle des 12 mois glissants.
4. Maquettes rapides des écrans clés.
5. Mise en place du dépôt, du Docker Compose et du premier déploiement.
