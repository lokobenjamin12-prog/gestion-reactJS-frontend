# Prompt Stitch — Module Salaires, Écran "Masse salariale" (Ndolecam Admin)

Tu conçois 1 écran pour le back-office "Ndolecam Admin" (Hoozon SARL). C'est un tableau de bord financier agrégé : la masse salariale totale de l'entreprise pour un mois donné.

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles, Contrats, Absences, Retards, Salaires) :

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

Sidebar identique (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**, sous-item actif : **Salaires**), TopNavBar identique. Devise : FCFA.

## Contraintes métier réelles (ne pas inventer d'autres champs)

- Cet écran affiche la masse salariale **d'un seul mois donné** (mois + année, deux champs obligatoires en haut de l'écran, pas une plage de dates)
- **Seuls les salaires déjà clôturés (`estCloture: true`) entrent dans le calcul** — un salaire encore ouvert n'est jamais compté dans les totaux. Il faut le mentionner clairement à l'écran (ex: "Basé sur les fiches clôturées de cette période")
- Les agrégats réels disponibles sont exactement : total brut, total des déductions, total des primes, total net, total versé, et l'écart total (versé − net)
- En dessous, une liste paginée des collaborateurs inclus dans ce calcul (uniquement ceux ayant une fiche clôturée ce mois-là), triée par nom de famille

## Écran : Masse salariale

- Breadcrumb "RH > Salaires > Masse salariale"
- En-tête "Masse salariale" + sous-titre "Vue d'ensemble financière de la paie pour une période donnée"
- Sélecteurs en haut : "Mois" (select) + "Année" (champ numérique) — pas d'autre filtre, pas de sélection de collaborateur
- Bandeau/note discrète : "Basé uniquement sur les fiches de salaire déjà clôturées pour cette période."
- Rangée de cartes statistiques (6 cartes ou une disposition en grille) :
  - Total brut
  - Total déductions
  - Total primes
  - Total net (mise en avant, la plus grande)
  - Total versé
  - Écart total (vert si 0 ou positif, rouge si négatif — mais dans les faits l'écart est presque toujours 0 puisque le versement doit correspondre exactement au net)
- Tableau en dessous : Collaborateur (avatar initiales + nom + poste), Salaire brut, Déductions, Primes, Salaire net, Montant versé
- Pagination simple (Précédent / Page X sur Y / Suivant)
- État vide : "Aucune fiche de salaire clôturée pour cette période." (si aucun salaire clôturé ce mois-là)
