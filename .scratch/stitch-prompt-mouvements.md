# Prompt Stitch — Mouvements de stock (sous-module Stock, module Commerce) — Ndolecam Admin

Tu conçois les écrans **Mouvements de stock**, dernier sous-module de Commerce > Stock (aux côtés d'Articles et Catégories déjà construits).

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

Sidebar : Commerce déplié (Articles / Catégories / Mouvements actif / Sessions commerciales).

## Contraintes métier réelles (ne pas inventer d'autres champs)

- Un mouvement a 4 types réels : `ENTREE`, `SORTIE`, `AJUSTEMENT`, `PERTE`.
  - `ENTREE` : ajoute `quantite` au stock actuel.
  - `SORTIE` / `PERTE` : retire `quantite` du stock actuel — **bloqué (400)** si `quantite` demandée > stock disponible.
  - `AJUSTEMENT` : `quantite` devient la **nouvelle quantité absolue** (pas un delta !) — à rendre très explicite dans le formulaire ("Cette valeur remplacera la quantité actuelle").
- Champs de création (`CreateMovementDto`) : `articleStockId` (obligatoire — identifie un couple article+format précis), `type`, `quantite` (entier positif), `motif` (optionnel, mais conseillé/attendu pour un ajustement), `movementDate` (date-heure, obligatoire).
- Après un mouvement, le serveur renvoie l'état avant/après (`quantiteAvant`, `quantiteApres`, `niveauAvant`, `niveauApres`, `valeurStock`) et une alerte éventuelle (`alerte.active/niveau/message`) si le nouveau niveau n'est pas NORMAL — à afficher en confirmation.
- Concurrence : si le stock a été modifié entre-temps par quelqu'un d'autre, le serveur renvoie une erreur 409 réelle à afficher tel quel.
- **Vue d'ensemble des stocks** (`GET /movement-stock/get-stocks`) : renvoie la liste complète (tous articles/formats actifs), **sans pagination** — pas de `page`/`limit` sur cet endpoint. Champs réels : `stockId, nomArticle, categoryNom, prixUnitaireCategory, quantite, niveauAlerte, valeurStock`. Le sous-objet `alerte.label/color/message` de cet endpoint est **cassé côté backend** (compare avec des valeurs anglaises `CRITICAL`/`LOW` qui ne matchent jamais l'enum réel `CRITIQUE`/`ALERTE`/`NORMAL`) — ignore-le, utilise `niveauAlerte` directement pour les badges.
- **Alertes de stock** (`GET /movement-stock/Obtenir-Articles-En-Alerte`) : liste filtrée (uniquement ALERTE/CRITIQUE), aussi sans pagination. Champs réels : `id, quantiteActuelle, niveauAlerte, nomArticle, format, prixUnite, isUrgent, messageLogistique` — `messageLogistique` est un vrai message généré côté serveur, utilisable tel quel.
- **Historique des mouvements** (`GET /movement-stock/mouvements`) : paginé, filtrable par `articleStockId`. Forme de pagination **différente de tous les autres modules** : `{ totalItems, itemCount, itemsPerPage, totalPages, currentPage }` (pas de `hasNextPage`/`hasPreviousPage` — à déduire de `currentPage < totalPages`). Chaque ligne : `id, type, quantite, avant, apres, motif, date, isSystem, articleId, articleNom, categoryId, categoryNom, auteur` (auteur = "Système" pour les mouvements automatiques d'initialisation).
- Un mouvement système (`isSystem: true`, ex: initialisation à la création d'un format) ne doit pas être présenté comme une action manuelle dans l'historique — l'afficher différemment (badge "Système" au lieu d'un nom d'auteur classique).

## Écran 1 : Vue d'ensemble des stocks

- En-tête "Vue d'ensemble des stocks" + sous-titre
- Recherche/filtre côté client (pas de recherche serveur sur cet endpoint)
- Tableau : Article, Format, Prix unitaire, Quantité, Valeur du stock, Niveau (badge NORMAL/ALERTE/CRITIQUE réel), Action "Nouveau mouvement" par ligne (pré-remplit le stock ciblé)
- Bouton "Nouveau mouvement" en en-tête (sans présélection)
- Lien vers "Voir les alertes" et "Voir l'historique"

## Écran 2 : Alertes de stock

- En-tête "Alertes de stock" + compteur
- Liste/cartes : Article + format, quantité restante, badge urgent si `isUrgent`, message logistique réel (`messageLogistique`)
- Pas de pagination (liste complète)

## Écran 3 : Historique des mouvements

- Filtre optionnel par article/format (`articleStockId`)
- Tableau : Date, Article, Format, Type (badge ENTREE/SORTIE/AJUSTEMENT/PERTE), Quantité, Avant → Après, Motif, Auteur (ou "Système" si `isSystem`)
- Pagination classique adaptée à la forme réelle (`currentPage`/`totalPages`/`totalItems`)

## Écran 4 : Enregistrer un mouvement

- Sélecteur Article + Format (résout `articleStockId` — alimenté par la vue d'ensemble des stocks)
- Type de mouvement (4 options réelles), avec aide contextuelle différente selon le type (surtout pour AJUSTEMENT : "nouvelle quantité totale", pas un ajout/retrait)
- Quantité, Motif (recommandé), Date du mouvement
- Après soumission : confirmation avec avant/après réel, et bandeau d'alerte si le nouveau niveau n'est pas NORMAL
