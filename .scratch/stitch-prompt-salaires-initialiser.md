# Prompt Stitch — Module Salaires, Écran "Initialiser un salaire" (Ndolecam Admin)

Tu conçois 1 écran pour le back-office "Ndolecam Admin" (Hoozon SARL). C'est l'écran de création d'une fiche de salaire mensuelle pour **un seul collaborateur** (pas un traitement en masse, malgré ce qu'on pourrait imaginer).

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

## Contraintes métier réelles (ne pas inventer d'autres champs ni de mode "en masse")

Le formulaire n'a que **3 champs** à saisir :
- Collaborateur (select — uniquement des employés actifs)
- Mois (select)
- Année (champ numérique)

Rien d'autre n'est saisissable ici. Le montant du salaire brut, le nombre de jours ouvrables et le prix journalier sont **calculés automatiquement par le serveur** à partir du salaire de base déjà enregistré sur la fiche du collaborateur (module Users) — ce n'est PAS un formulaire de saisie de salaire, juste une action de déclenchement.

Règles à respecter dans l'UI :
- **Un seul collaborateur à la fois** — ne pas concevoir de mode "sélection multiple" ou "initialiser tout le monde", même si ça peut sembler être l'usage attendu pour un écran de début de mois
- Le serveur refuse l'opération si le collaborateur est inactif, ou si une fiche de salaire existe déjà pour ce collaborateur/mois/année (l'utilisateur doit voir le message d'erreur réel du serveur dans ces cas)
- Après succès, l'action redirige naturellement vers le détail de la fiche fraîchement créée

## Écran : Initialiser un salaire

- Breadcrumb "RH > Salaires > Initialiser"
- Titre "Initialiser un salaire" + sous-titre explicatif court (ex: "Génère une fiche de paie pour un collaborateur, à partir de son salaire de base actuel.")
- Une seule carte centrée avec le formulaire :
  - Select "Collaborateur" (uniquement les employés actifs)
  - Select "Mois"
  - Champ numérique "Année"
  - Une note info discrète : "Le salaire brut, le nombre de jours ouvrables et le prix journalier seront calculés automatiquement à partir de la fiche du collaborateur."
- Boutons "Annuler" / "Initialiser"
- Pas de tableau récapitulatif, pas de prévisualisation du montant (le serveur ne renvoie ce calcul qu'après la création) — c'est un écran volontairement minimal
