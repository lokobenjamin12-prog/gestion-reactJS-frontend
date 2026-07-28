# Prompt Stitch — Module Départements (Ndolecam Admin)

Tu conçois 4 écrans pour le back-office "Ndolecam Admin" (Hoozon SARL). Le module concerné est **Départements** : la structure organisationnelle à laquelle chaque rôle est rattaché (ex: "FINANCE", "RESSOURCES HUMAINES", "COMMERCE").

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

Sidebar identique (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**, sous-item actif : **Départements**, avec Contrats/Absences/Retards/Salaires visibles aussi dans le sous-menu), TopNavBar identique.

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)

Un département n'a qu'**un seul champ éditable : `name`**. Pas de description, pas de responsable, pas de budget, pas de logo — juste un nom. Le nom est automatiquement nettoyé et mis en **majuscules** par le serveur (ex: "  finance  " devient "FINANCE"), et doit être unique.

- Un département a une liste de **rôles** rattachés — chaque rôle a un poste (`post`), un nom généré (`nomRole`), et un nombre d'utilisateurs
- **Suppression bloquée (409)** si au moins un rôle est encore rattaché au département — message d'erreur réel du serveur à afficher, avec le nombre de rôles concernés
- La modification est **ignorée silencieusement** côté serveur si le nouveau nom est identique à l'ancien (une fois normalisé) — pas la peine de gérer ce cas spécialement côté UI, juste soumettre normalement
- Pas de soft delete ici — la suppression est définitive (contrairement aux Users/Contrats)

## Écran 1 : Liste des départements

- En-tête "Départements" + sous-titre "Structure organisationnelle de l'entreprise"
- Barre de recherche par nom
- Bouton primaire "Nouveau département"
- Tableau : Nom (badge majuscule), Nombre de rôles rattachés, Aperçu des rôles (2-3 badges de `post`/`nomRole` + "+N" si plus), Actions (Voir, Modifier, Supprimer)
- Pagination classique (Précédent / Page X sur Y / Suivant, avec "Affichage A-B sur N départements")
- État vide : "Aucun département ne correspond à ces critères."

## Écran 2 : Détail d'un département

- Breadcrumb "RH > Départements > {Nom}"
- En-tête avec le nom du département (grand badge majuscule), boutons "Modifier" et "Supprimer"
- Carte "Rôles rattachés" : liste des rôles de ce département, chacun affichant le poste, le nombre d'utilisateurs, et un lien vers la fiche détaillée du rôle (déjà existante ailleurs dans l'app)
- Si aucun rôle rattaché : état vide "Aucun rôle n'est encore rattaché à ce département." — c'est aussi la condition qui permettrait une suppression sans erreur

## Écran 3 : Créer un département

- Formulaire minimal, une seule carte centrée : un seul champ "Nom du département"
- Note d'aide : "Le nom sera automatiquement mis en majuscules et doit être unique."
- Boutons "Annuler" / "Créer"

## Écran 4 : Modifier un département

- Même formulaire que la création, pré-rempli avec le nom actuel
- Boutons "Annuler" / "Enregistrer"
