# Prompt Stitch — Sous-module Stock (module Commerce) — Ndolecam Admin

Tu conçois les écrans du sous-module **Stock**, qui appartient au module **Commerce** (Commerce > Stock > Articles / Catégories / Mouvements de stock — "Sessions commerciales" est un autre sous-module de Commerce, distinct de Stock).

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles, Contrats, Absences, Retards, Salaires, Départements, Rapports) :

```js
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#ffb5a1", "surface-dim": "#dad9e0",
        "secondary-fixed-dim": "#bdc5e9", "secondary": "#555d7c",
        "on-secondary-fixed-variant": "#3d4663", "inverse-primary": "#b5c4ff",
        "error-container": "#ffdad6", "on-secondary-container": "#545c7b",
        "on-tertiary-fixed-variant": "#7b2e18", "primary-fixed-dim": "#b5c4ff",
        "on-error": "#ffffff", "outline": "#757682",
        "surface-container-highest": "#e3e1e9", "on-tertiary-container": "#da765a",
        "on-secondary-fixed": "#121a36", "on-primary-fixed": "#00164e",
        "surface": "#faf8ff", "on-primary-fixed-variant": "#29428c",
        "background": "#faf8ff", "surface-container": "#efedf4",
        "on-background": "#1a1b20", "surface-variant": "#e3e1e9",
        "on-tertiary-fixed": "#3b0900", "on-error-container": "#93000a",
        "primary-fixed": "#dce1ff", "on-secondary": "#ffffff",
        "on-surface-variant": "#444651", "surface-bright": "#faf8ff",
        "inverse-surface": "#2f3035", "on-surface": "#1a1b20",
        "surface-tint": "#425aa6", "tertiary-container": "#551201",
        "primary-container": "#00236f", "outline-variant": "#c5c5d3",
        "error": "#ba1a1a", "secondary-fixed": "#dce1ff",
        "tertiary-fixed": "#ffdbd1", "on-primary-container": "#778ede",
        "surface-container-low": "#f4f3fa", "inverse-on-surface": "#f1f0f7",
        "surface-container-high": "#e9e7ee", "tertiary": "#320600",
        "primary": "#001142", "on-tertiary": "#ffffff",
        "secondary-container": "#ced6fb", "surface-container-lowest": "#ffffff",
        "on-primary": "#ffffff"
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      spacing: { base: "4px", sm: "8px", lg: "24px", "margin-desktop": "32px", xs: "4px", xl: "32px", "margin-mobile": "16px", gutter: "16px", md: "16px" },
      fontFamily: { "label-md": ["JetBrains Mono"], "headline-lg": ["Inter"], "display-lg": ["Inter"], "title-md": ["Inter"], "label-sm": ["JetBrains Mono"], "body-sm": ["Inter"], "body-md": ["Inter"] },
      fontSize: {
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "title-md": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "label-sm": ["10px", { lineHeight: "14px", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }]
      }
    }
  }
}
```

Sidebar : Dashboard, Users, Roles, **Commerce** (onglet actif, déplié — sous-items : **Stock** déplié aussi, avec Articles / Catégories / Mouvements de stock, puis Sessions commerciales en item séparé), RH (Contrats/Absences/Retards/Salaires/Départements/Rapports). TopNavBar identique aux écrans précédents.

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)

- Un **Article** n'a qu'un seul champ significatif : `nom` (unique dans tout le catalogue). Pas de description obligatoire, pas de champ "unité" fonctionnel (le champ existe dans le DTO de modification mais n'est jamais appliqué côté serveur — bug backend connu, ne pas l'exposer dans les formulaires).
- Un article n'a **aucun prix ni quantité propre** — ces valeurs vivent au niveau de ses **formats** (les Catégories). Un article affiche donc : la liste de ses formats (ex: "Sachet", "Carton"), la quantité totale tous formats confondus, la valeur totale du stock (Σ quantité × prix par format), et un indicateur d'alerte global (`enAlerte`, vrai si au moins un format est en alerte ou en critique).
- Une **Catégorie** (= "format" de conditionnement, ex: Sachet/Carton/Bouteille/Douzaine) appartient à un seul article (`articleId`), a un `nomUnique` (unique par article, pas globalement), un `prixUnite` (FCFA), une `description` optionnelle, et deux seuils optionnels (`seuilAlerte`, `seuilCritique` — valeurs par défaut si omis). Créer une catégorie initialise automatiquement sa ligne de stock (quantité 0) et un mouvement de stock système "INITIALISATION" — invisible pour l'utilisateur, à ne pas montrer comme une action manuelle.
- Le **niveau d'alerte** (`niveauAlerte` / `alerte`) est une chaîne parmi `NORMAL`, `ALERTE`, `CRITIQUE` (calculée côté serveur à partir des seuils) — à afficher avec un badge coloré (vert/orange/rouge).
- **Deux façons de créer un article** : (1) "Créer un article simple" — juste un nom, aucun format ni stock, à compléter plus tard ; (2) "Créer un article complet" — nom + un premier format (nom, prix, seuils optionnels) créés en une seule transaction. Prévoir les deux entrées dans l'UI (ex: bouton principal "Nouvel article" ouvrant le formulaire complet, lien secondaire "Créer une référence simple").
- **Archivage d'un article bloqué (403)** si la quantité totale en stock (tous formats) est encore > 0 — message réel du serveur à afficher, invitant à d'abord écouler ou ajuster le stock.
- **Suppression définitive bloquée (403)** si l'article a un historique de mouvements de stock réels (hors mouvements système d'initialisation) — utiliser l'archivage à la place.
- Archiver un article archive automatiquement tous ses formats et leurs lignes de stock ; les restaurer réactive tout en cascade.
- `canMoveStock` (renvoyé par la fiche détaillée) indique si l'article est éligible aux mouvements de stock (faux si archivé) — utilisé pour activer/désactiver le futur bouton "Nouveau mouvement de stock".
- **Archivage/restauration d'une catégorie bloqués en cascade avec son article parent** : impossible de restaurer une catégorie si l'article parent est encore archivé (message réel à afficher : il faut d'abord restaurer l'article).
- **Suppression définitive d'une catégorie bloquée** si elle a des mouvements de stock réels (hors initialisation système).
- Pagination classique partout : `total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPreviousPage`.

## Écran 1 : Liste des articles

- En-tête "Articles" + sous-titre "Catalogue des références produits"
- Barre de recherche (nom d'article ou nom de format)
- Filtre de statut : Actifs (par défaut) / Archivés / Tous
- Bouton primaire "Nouvel article" (+ lien secondaire discret "Créer une référence simple")
- Tableau : Nom de l'article, Formats (badges — ex: "Sachet", "Carton", "+N"), Quantité totale, Valeur totale (FCFA), Alerte (badge si `enAlerte`), Statut (Actif/Archivé), Actions (Voir, Modifier, Archiver/Restaurer)
- État vide : "Aucun article ne correspond à ces critères."
- Pagination classique (Précédent / Page X sur Y / Suivant, "Affichage A-B sur N articles")

## Écran 2 : Détail d'un article

- Breadcrumb "Commerce > Stock > Articles > {Nom}"
- En-tête : nom de l'article (grand), statut (Actif/Archivé), boutons Modifier / Archiver ou Restaurer
- Carte "Résumé" : quantité totale, valeur totale, statut d'alerte global
- Tableau "Formats & Stock" : pour chaque format — nom, prix unitaire, quantité actuelle, niveau d'alerte (badge), valeur estimée (quantité × prix) — avec un bouton "Ajouter un format" menant à l'écran de création de catégorie pré-rempli avec cet article
- Si aucun format : état vide "Aucun format défini pour cet article." + CTA "Ajouter un premier format"

## Écran 3 : Créer un article (complet, avec premier format)

- Formulaire en une carte : Nom de l'article, Description (optionnelle)
- Section "Premier format" : Nom du format (ex: Sachet), Prix unitaire (FCFA), Seuil d'alerte (optionnel), Seuil critique (optionnel)
- Note d'aide : la création initialise automatiquement le stock à 0 pour ce format
- Boutons "Annuler" / "Créer l'article"

## Écran 4 : Modifier un article

- Formulaire minimal : un seul champ modifiable, "Nom de l'article" (le champ "unité" ne doit PAS apparaître — inopérant côté serveur)
- Message si l'article est archivé : action bloquée, il faut d'abord le restaurer
- Boutons "Annuler" / "Enregistrer"
