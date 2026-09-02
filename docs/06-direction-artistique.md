# Direction artistique

> Le propriétaire a fourni des maquettes (dashboard sombre + page de connexion) qui
> lancent officiellement la passe de design frontend — jusque-là volontairement
> minimaliste (cf. `AGENTS.md` §3.9). Ce document fixe les tokens dérivés de ces
> maquettes ; toutes les pages suivantes s'y conforment.
> Dernière mise à jour : 2026-09-01.

## Typographie

| Rôle | Police | Raison |
|---|---|---|
| Titres, chiffres clés (jauge, CA, %) | **Space Grotesk** | Rendu géométrique et arrondi, correspond au style des maquettes (`312`, `28 400 €`). |
| Texte courant, UI, formulaires | **Inter** | Neutre, très lisible, duo standard avec Space Grotesk. |

Chargées via `next/font/google` (auto-hébergées par Next, pas de requête externe au
runtime).

## Icônes

**lucide-react** — traits fins à coins arrondis, correspond aux pictos des maquettes
(horloge, étoile, mallette, balance).

## Palette (variables CSS, `frontend/src/app/globals.css`)

| Variable | Valeur | Usage |
|---|---|---|
| `--bg` | `#080b14` | Fond de page |
| `--bg-elevated` | `#10152a` | Cartes |
| `--border` | `rgba(255,255,255,.08)` | Bordures de cartes |
| `--text-primary` | `#f1f5f9` | Texte principal |
| `--text-secondary` | `#94a3b8` | Texte secondaire |
| `--text-muted` | `#64748b` | Légendes, labels |
| `--accent-blue` | `#3b82f6` | Jauge intermittence, actions primaires |
| `--accent-blue-light` | `#60a5fa` | Dégradé jauge |
| `--accent-gold` | `#f5a524` | CA freelance (courbe, glow) |
| `--accent-purple` | `#8b5cf6` | Donut répartition, pills |
| `--accent-pink` | `#ec4899` | Accent secondaire du donut |

Pas de bascule clair/sombre au MVP : l'app est nativement sombre (cohérent avec les
maquettes). Ajout d'un thème clair = roadmap si demandé.

## Écarts assumés par rapport aux maquettes fournies

- **Photo du panneau de connexion** : remplacée par une composition graphique
  (dégradé + icônes lucide + trame de points), pour ne dépendre d'aucune image
  externe non fournie/licenciée. Même ambiance (bureau de montage), sans photo réelle.
- **Nom de marque** : les maquettes affichent des textes de mise en situation
  (« Suivi d'activité », « studioflow.fr »). Le nom de travail retenu pour le projet
  est **Studiflow** (cf. `docs/01-note-de-cadrage.md`), figé par le
  propriétaire ; le remplacement dans le code est trivial (une chaîne).

## Composants de base

`frontend/src/components/ui/` : `Button`, `Input`, `Card` — construits à la main avec
Tailwind (pas de CLI shadcn exécutée), dans le même esprit que les composants shadcn
mais sans dépendance externe supplémentaire à ce stade.
