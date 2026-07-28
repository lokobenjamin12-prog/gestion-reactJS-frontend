# Prompt Stitch — Sessions commerciales (module Commerce) — Ndolecam Admin

Tu conçois les écrans **Sessions commerciales**, dernier sous-module de Commerce (aux côtés de Stock déjà construit). Une session représente une "course" : un commercial part avec un stock de marchandises confié par un manager, vend sur le terrain, puis revient déclarer ses ventes/retours/dépenses.

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

Sidebar : Commerce déplié (Stock / **Sessions commerciales** actif).

## Contraintes métier réelles (ne pas inventer d'autres champs)

- Une session a 3 statuts : `OPEN`, `CLOSED`, `CANCELLED`.
- **Ouverture** (par un manager/admin pour un commercial) : sélectionne un commercial, un couple article+format (`articleStockId`), une quantité de départ. Bloquée (400) si le commercial a déjà une session ouverte, si le commercial n'est pas actif, ou si le stock central est insuffisant. Décrémente immédiatement le stock central (mouvement système SORTIE automatique).
- **Clôture** (par un manager) : saisit la quantité retournée invendue (`quantiteRetour`, ne peut pas dépasser `quantiteDepart`), une liste optionnelle de dépenses (montant + motif), et éventuellement l'heure de retour. Calcule automatiquement `quantiteVendue`, `totalVentesRecues` (théorique), `chiffreAffaireTheorique`, `totalDepenses`. Réintègre le stock retourné (mouvement système ENTREE).
- **`ecartCaisse` est actuellement toujours à 0** (bug backend confirmé — `totalVentesRecues` est calculé théoriquement, pas saisi comme montant réellement encaissé) — afficher le champ tel quel (donnée réelle), sans sur-interpréter sa valeur.
- **Annulation** : uniquement si la session est encore `OPEN`. Réintègre tout le stock de départ, aucun flux financier n'est calculé. Nécessite l'ID de l'admin/manager courant.
- Pas de champ "titre"/"notes libres" sur la session — seulement les champs listés.
- Filtre de liste par statut (`status`) et par jour d'ouverture exact (`jourOuverture`, format YYYY-MM-DD) — pas de recherche texte libre.
- Pagination classique standard (`total, page, limit, lastPage, hasNextPage, hasPreviousPage`).
- `jourOuverture` est une date "pure" (YYYY-MM-DD) ; `heureDepart`/`heureRetour` sont de vrais horodatages précis.

## Écran 1 : Liste des sessions

- En-tête "Sessions commerciales" + sous-titre
- Filtres : Statut (Toutes/Ouvertes/Clôturées/Annulées), Jour d'ouverture (date picker)
- Bouton "Ouvrir une session"        
- Tableau : Commercial, Article/Format, Quantité départ, Statut (badge), Jour d'ouverture, Manager, Actions (Voir, Clôturer si OPEN, Annuler si OPEN)
- Pagination classique

## Écran 2 : Détail d'une session

- Breadcrumb "Commerce > Sessions > {Commercial} — {Jour}"
- En-tête : statut (badge), commercial, manager, article/format
- Carte "Départ" : quantité de départ, heure de départ, jour d'ouverture
- Carte "Retour" (si CLOSED) : quantité retournée, quantité vendue, heure de retour
- Carte "Finances" (si CLOSED) : chiffre d'affaires théorique, total ventes reçues, total dépenses, écart de caisse, liste des dépenses détaillées
- Actions : Clôturer / Annuler selon le statut (OPEN uniquement)

## Écran 3 : Ouvrir une session

- Sélecteur Commercial (liste des utilisateurs actifs)
- Sélecteur Article + Format (couple articleStockId, avec quantité disponible affichée)
- Quantité de départ
- Jour d'ouverture (optionnel, aujourd'hui par défaut) et heure de départ (optionnel)
- Boutons Annuler / Ouvrir la session

## Écran 4 : Clôturer une session (probablement une modale depuis le Détail)

- Rappel du contexte (commercial, quantité de départ)
- Quantité retournée (max = quantité de départ)
- Liste dynamique de dépenses (montant + motif, ajout/suppression de lignes)
- Heure de retour (optionnelle)
- Récapitulatif calculé en direct : quantité vendue, chiffre d'affaires théorique
- Boutons Annuler / Clôturer la session
