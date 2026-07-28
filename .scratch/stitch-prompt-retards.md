# Prompt Stitch — Module Retards (Ndolecam Admin)

Tu conçois 3 écrans pour le back-office "Ndolecam Admin" (Hoozon SARL). Le module concerné est **Retards** : suivi RH des jours de retard des collaborateurs, mois par mois. Structure très proche du module Absences déjà construit, avec un champ en plus : l'heure d'arrivée.

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles, Contrats, Absences) :

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

Sidebar identique (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**, sous-item actif : **Retards**, avec Contrats/Absences/Salaires visibles aussi dans le sous-menu), TopNavBar identique (recherche, notifications, settings, avatar, Logout).

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)

Système de **pointage mensuel géré par un admin/RH**, pas de demande en libre-service, pas de workflow d'approbation :

- Un jour de retard a exactement trois champs : `date` (YYYY-MM-DD), `estJustifie` (booléen : Justifié / Injustifié), et `heureArrivee` (optionnel, format HH:MM — l'heure effective d'arrivée du collaborateur). `heureArrivee` est particulièrement pertinente quand le retard est **injustifié**
- **Un seul enregistrement par collaborateur par mois**, qui regroupe tous ses jours de retard de ce mois
- Règle métier : retard justifié → aucune déduction | retard injustifié → la journée est annulée, 1 jour de salaire déduit
- **Contrainte forte** : on ne peut ajouter/modifier/supprimer des jours de retard que si le salaire du mois concerné existe déjà et n'est pas encore clôturé côté RH — sinon l'action échoue avec le message d'erreur exact du serveur
- **Contrainte forte et spécifique à ce module** : un même jour ne peut pas être à la fois un retard ET une absence pour le même collaborateur — le serveur rejette avec une erreur explicite si conflit

## Écran 1 : Liste des fiches de retard mensuelles

- En-tête "Retards" + sous-titre "Suivi mensuel des retards des collaborateurs"
- Filtres : select "Collaborateur", select "Mois", champ numérique "Année"
- Bouton primaire "Ajouter des jours de retard"
- Tableau : Collaborateur (avatar initiales + nom), Période (ex: "Juillet 2026"), Jours justifiés, Jours injustifiés (badge rouge si > 0), Total, Action "Voir le détail"
- Pagination simple (Précédent / Page X sur Y / Suivant)
- État vide : "Aucune fiche de retard enregistrée pour ces critères."

## Écran 2 : Détail d'une fiche mensuelle de retard

- Breadcrumb "Retards > {Collaborateur} > {Mois} {Année}"
- Carte résumé : collaborateur, période, compteurs "X jours justifiés" / "Y jours injustifiés" / "Z jours au total"
- Liste chronologique des jours, colonnes : Date, **Heure d'arrivée** (ex: "08:45", ou "—" si non renseignée), Statut (badge Justifié/Injustifié), Actions (basculer le statut, modifier l'heure d'arrivée, supprimer)
- Bouton "Ajouter un jour" (date + heure d'arrivée optionnelle + case "Justifié")
- État vide si la fiche n'a aucun jour

## Écran 3 : Ajouter des jours de retard

- Formulaire : select "Collaborateur", select "Mois", champ "Année"
- Sélecteur de dates multiples ("+ ajouter une date"), chaque ligne avec : date, champ heure (HH:MM, optionnel), case "Justifié"
- Note d'avertissement : "L'ajout est impossible si le salaire du mois n'est pas encore initialisé, ou s'il est déjà clôturé. Un jour ne peut pas être à la fois un retard et une absence."
- Boutons "Annuler" / "Enregistrer"
