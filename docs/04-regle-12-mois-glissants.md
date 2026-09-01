# Règle des 12 mois glissants

> Cœur du produit. Spécification de référence pour l'implémentation et les tests.
> Implémentation : `backend/src/calc/rolling-window.ts` (fonction **pure**, sans Prisma,
> sans NestJS). Tests : `backend/src/calc/rolling-window.spec.ts`.
> Dernière mise à jour : 2026-09-01.

## 1. Principe

Le monteur alterne deux régimes qui ne se comptent pas pareil :

- **Intermittence** → heures déclarées, à comparer à un **seuil de référence**
  (507 h par défaut) sur une **fenêtre de 12 mois glissants**.
- **Freelance** → jours facturés et chiffre d'affaires HT.

Un seul calcul produit les **trois indicateurs** du tableau de bord.

## 2. Contrat de la fonction

```ts
type TypeMission = 'INTERMITTENCE' | 'FREELANCE';
type StatutMission = 'PROPOSEE' | 'CONFIRMEE' | 'TERMINEE';

interface MissionCalc {
  type: TypeMission;
  statut: StatutMission;
  dateFin: Date;          // date de rattachement pour TOUS les calculs
  heures?: number | null;      // intermittence — déjà converti depuis les cachets en amont
  montantHT?: number | null;   // freelance
  nbJours?: number | null;     // freelance
}

interface ConfigCalc {
  seuilHeures: number;         // défaut 507
  dureeFenetreMois: number;    // défaut 12
  journeeTypeHeures: number;   // défaut 8
  // heuresParCachet n'est PAS utilisé ici : la conversion cachets→heures
  // est faite à l'enregistrement de la mission, pas dans ce calcul.
}

interface Indicateurs {
  fenetre: { debut: Date; fin: Date };
  jauge: {
    heuresCumulees: number;
    seuil: number;
    pourcentage: number;   // heuresCumulees / seuil ; peut dépasser 1
    restant: number;       // max(0, seuil - heuresCumulees)
  };
  caParMois: { mois: string; montantHT: number }[];  // "YYYY-MM", 1 entrée par mois de la fenêtre, 0 par défaut
  caTotal: number;
  repartition: {
    heuresIntermittence: number;
    heuresFreelanceEq: number;   // somme(nbJours) * journeeTypeHeures
    partIntermittence: number;   // proportion 0..1 ; 0 si total nul
    partFreelance: number;       // proportion 0..1 ; 0 si total nul
  };
}

function calculerIndicateurs(
  missions: MissionCalc[],
  config: ConfigCalc,
  dateRef: Date,
): Indicateurs
```

**Propriétés garanties :**

- Pure : aucune I/O, aucun accès horloge interne (`dateRef` est injectée), déterministe.
- Ne mute pas ses entrées.
- Ne lève jamais sur des données vides ou incohérentes : renvoie des zéros, jamais `NaN`.

## 3. Définition de la fenêtre (alignée sur les mois)

Choix retenu : la fenêtre couvre les `dureeFenetreMois` **mois calendaires** qui se
terminent avec le mois de `dateRef`.

```
finMois      = mois de dateRef
borneDebut   = premier jour de finMois, moins (dureeFenetreMois - 1) mois, à 00:00:00
borneFin     = dateRef (inclus)   // on ne compte pas une mission datée après aujourd'hui
```

Le décalage de mois clampe le jour à 1 (on prend toujours le 1er du mois de départ),
ce qui évite tout débordement de type « 31 → 3 mars ».

**Exemples :**

| `dateRef` | `dureeFenetreMois` | `borneDebut` | `borneFin` | Mois couverts |
|---|---|---|---|---|
| 2026-09-01 | 12 | 2025-10-01 | 2026-09-01 | 2025-10 … 2026-09 (12) |
| 2026-03-15 | 12 | 2025-04-01 | 2026-03-15 | 2025-04 … 2026-03 (12) |
| 2024-02-29 | 12 | 2023-03-01 | 2024-02-29 | 2023-03 … 2024-02 (12) |
| 2026-06-30 | 6  | 2026-01-01 | 2026-06-30 | 2026-01 … 2026-06 (6) |

*Alternative écartée* : fenêtre « au jour près » `[dateRef − dureeFenetreMois mois, dateRef]`.
Plus proche de la lettre du brief, mais introduit un mois calendaire partiel en début
de fenêtre → le total du graphe CA/mois ne coïncide plus avec le CA réellement pris en
compte, et l'explication au jury devient bancale. On tranche pour l'alignement mois.

## 4. Éligibilité d'une mission

Une mission est prise en compte si **les trois** conditions sont vraies :

1. `statut === 'CONFIRMEE' || statut === 'TERMINEE'` — les `PROPOSEE` sont exclues des
   calculs (mais restent affichées dans le calendrier, hors de ce module).
2. `borneDebut <= dateFin && dateFin <= borneFin` — rattachement à la **date de fin**,
   **tout ou rien**, **jamais de prorata**, même si la mission a commencé avant la
   fenêtre.
3. le `type` correspond à l'indicateur calculé (intermittence pour la jauge,
   freelance pour le CA).

Comparaison de dates faite sur l'instant complet ; `borneDebut` est à `00:00:00` et
`dateFin` d'une mission est stockée en `@db.Date` (00:00:00 UTC), donc une mission dont
la date de fin est le 1er jour de la fenêtre est **incluse**.

## 5. Calcul des indicateurs

### 5.1 Jauge (heures d'intermittence)

```
missionsInt   = missions éligibles avec type INTERMITTENCE
heuresCumulees = somme(m.heures ?? 0)
seuil          = config.seuilHeures
pourcentage    = seuil > 0 ? heuresCumulees / seuil : 0
restant        = max(0, seuil - heuresCumulees)
```

### 5.2 CA freelance par mois

```
seaux = [] ; pour i de 0 à dureeFenetreMois-1 :
    mois = borneDebut + i mois  →  clé "YYYY-MM"  →  seaux[clé] = 0
pour chaque mission éligible de type FREELANCE :
    clé = "YYYY-MM" de m.dateFin
    seaux[clé] += (m.montantHT ?? 0)     // la clé existe forcément (mission éligible ⇒ dateFin dans la fenêtre)
caParMois = seaux triés par mois croissant
caTotal   = somme des valeurs
```

### 5.3 Répartition intermittence / freelance

```
heuresIntermittence = heuresCumulees (cf. 5.1)
heuresFreelanceEq   = somme(m.nbJours ?? 0) sur missions freelance éligibles * config.journeeTypeHeures
total               = heuresIntermittence + heuresFreelanceEq
partIntermittence   = total > 0 ? heuresIntermittence / total : 0
partFreelance       = total > 0 ? heuresFreelanceEq   / total : 0
```

## 6. Cas de test (Jest)

| # | Cas | Attendu |
|---|---|---|
| 1 | Mission intermittence, `dateFin === borneDebut`, 10 h, `CONFIRMEE` | comptée : `heuresCumulees === 10` |
| 2 | Mission intermittence, `dateFin === borneDebut − 1 jour`, 10 h | **non** comptée : `heuresCumulees === 0` |
| 3 | Mission intermittence, `dateDebut` bien avant la fenêtre, `dateFin` dans la fenêtre, 60 h | 60 h comptées **en entier** (pas de prorata) |
| 4 | Mission intermittence `PROPOSEE` dans la fenêtre, 40 h | exclue : `heuresCumulees === 0` |
| 5 | Mission `CONFIRMEE` avec `dateFin > borneFin` (future) | exclue |
| 6 | `dateRef = 2024-02-29`, fenêtre 12 | `fenetre.debut` = 2023-03-01, aucun crash |
| 7 | (conversion cachets faite en amont) mission avec `heures = 24` | `heuresCumulees === 24` |
| 8 | `heuresCumulees = 600`, `seuil = 507` | `pourcentage > 1`, `restant === 0` |
| 9 | Config `seuil = 300`, `dureeFenetreMois = 6` | fenêtre de 6 mois, `seuil === 300`, `caParMois.length === 6` |
| 10 | Aucune mission | tous les indicateurs à 0, aucun `NaN`, `caParMois.length === dureeFenetreMois` |
| 11 | Aucun freelance sur un mois du milieu de la fenêtre | ce mois présent dans `caParMois` avec `montantHT === 0` |
| 12 | Mix : 2 intermittence + 2 freelance éligibles + 1 hors fenêtre | jauge, `caParMois`, `caTotal` et `repartition` cohérents entre eux |

## 7. Où vit ce calcul

- `backend/src/calc/rolling-window.ts` — la fonction et ses types, **zéro import** de
  `@nestjs/*` ou `@prisma/client`.
- `backend/src/calc/rolling-window.spec.ts` — les 12 cas ci-dessus.
- Le module `dashboard/` de NestJS se contente de charger les missions + la config via
  Prisma, d'appeler `calculerIndicateurs(missions, config, new Date())` et de renvoyer
  le résultat en JSON.
