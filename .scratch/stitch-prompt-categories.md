# Prompt Stitch — Catégories (sous-module Stock, module Commerce) — Ndolecam Admin

Tu conçois les écrans **Catégories** (= "formats" de conditionnement d'un article — ex: Sachet, Carton, Bouteille — PAS une taxonomie produit classique). Fait partie de Commerce > Stock > Catégories, aux côtés d'Articles et Mouvements de stock déjà construits.

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents :

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

Sidebar : Commerce déplié (Articles / Catégories actif / Mouvements de stock / Sessions commerciales).

## Contraintes métier réelles (ne pas inventer d'autres champs)

- Une catégorie = **`nomUnique`** (unique par article, pas globalement), **`prixUnite`** (FCFA), **`description`** optionnelle, rattachée à un **`articleId`** obligatoire. Deux seuils optionnels **`seuilAlerte`** (défaut 15) et **`seuilCritique`** (défaut 5).
- **Création bloquée (403)** si l'article parent est archivé. **Conflit (409)** si le nom existe déjà pour cet article (actif ou archivé — dans ce dernier cas le message invite à le restaurer plutôt qu'à le recréer).
- La création initialise automatiquement une ligne de stock à 0 et un mouvement système "INITIALISATION" — invisible dans l'UI, pas une étape manuelle.
- **Archiver une catégorie archive aussi sa ligne de stock.** **Restaurer une catégorie est bloqué (403)** si l'article parent est encore archivé — message réel : il faut d'abord restaurer l'article.
- **Suppression définitive bloquée (403)** si la catégorie a des mouvements de stock réels (hors initialisation système) — utiliser l'archivage à la place.
- La modification (`PATCH /categories/update/:id`) ne renvoie que `{id, nomUnique, prixUnite, message, updatedAt}` — se limiter à Nom du format, Prix unitaire, Description dans le formulaire d'édition (pas de champ pour changer l'article parent, ni les seuils, qui vivent réellement au niveau de la ligne de stock).
- Pagination classique : `total, page, limit, totalPages, hasNextPage, hasPreviousPage`. La liste peut être filtrée par `articleId` (utile pour arriver depuis la fiche d'un article) et par recherche texte sur le nom.
- Chaque ligne de la liste affiche : nom du format, article parent, prix unitaire, description, quantité disponible (`quantiteDisponible`), alerte (`alerte`: NORMAL/ALERTE/CRITIQUE — la vraie valeur, pas un booléen).

## Écran 1 : Liste des catégories

- En-tête "Catégories" + sous-titre "Formats de conditionnement par article"
- Filtres : recherche texte, sélecteur d'article (optionnel — vide = tous les articles)
- Bouton "Nouveau format"
- Tableau : Format (nom), Article parent (nom, lien vers sa fiche), Prix unitaire, Quantité disponible, Alerte (badge NORMAL/ALERTE/CRITIQUE), Actions (Voir, Modifier, Archiver/Restaurer)
- État vide, pagination classique

## Écran 2 : Détail d'une catégorie

- Breadcrumb "Commerce > Stock > Catégories > {Article} — {Format}"
- En-tête : nom du format, article parent (lien), statut
- Carte infos : prix unitaire, description, quantité en stock, niveau d'alerte
- Boutons Modifier / Archiver ou Restaurer

## Écran 3 : Créer un format (catégorie)

- Sélecteur d'article parent (pré-rempli si on arrive depuis la fiche d'un article, sinon à choisir) — désactivé/absent si l'article présélectionné est archivé
- Nom du format, Prix unitaire, Description (optionnelle), Seuil d'alerte (optionnel), Seuil critique (optionnel)
- Boutons Annuler / Créer

## Écran 4 : Modifier un format

- Formulaire limité à : Nom du format, Prix unitaire, Description
- Boutons Annuler / Enregistrer
