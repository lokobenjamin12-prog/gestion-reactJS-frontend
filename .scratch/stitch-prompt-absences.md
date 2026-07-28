# Prompt Stitch — Module Absences (Ndolecam Admin)

Tu conçois 3 écrans pour le back-office "Ndolecam Admin" (Hoozon SARL). Le module concerné est **Absences** : suivi RH des jours d'absence des collaborateurs, mois par mois.
Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles, Contrats) :


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

Sidebar identique (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**, sous-item actif : **Absences**), TopNavBar identique (recherche, notifications, settings, avatar, Logout).

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)

C'est un système de **pointage mensuel géré par un admin/RH**, PAS un système de demande de congé en libre-service par l'employé. Il n'y a **aucun workflow d'approbation** (pas de statut "en attente / approuvé / rejeté"), et **aucune catégorie de motif** (pas de "maladie", "congé payé", etc. dans les données réelles disponibles) — uniquement deux états possibles par jour :

- Un jour d'absence a exactement deux champs : `date` (YYYY-MM-DD) et `estJustifie` (booléen : Justifiée / Injustifiée)
- **Un seul enregistrement par collaborateur par mois**, qui regroupe tous ses jours d'absence de ce mois (`{userId, mois, annee, jours: [{date, estJustifie}, ...]}`)
- Règle métier : absence justifiée → aucune déduction de salaire | absence injustifiée → 1 jour de salaire déduit
- **Contrainte forte** : on ne peut ajouter/modifier/supprimer des jours d'absence que si le "salaire" du mois concerné existe déjà et n'est pas encore clôturé côté RH — sinon l'action échoue avec un message d'erreur explicite du serveur (à afficher tel quel, pas de message générique)
- **Contrainte forte** : un même jour ne peut pas être à la fois une absence ET un retard pour le même collaborateur — le serveur rejette avec une erreur listant les dates en conflit

## Écran 1 : Liste des fiches d'absence mensuelles

- En-tête "Absences" + sous-titre "Suivi mensuel des absences des collaborateurs"
- Filtres : select "Collaborateur", select "Mois" (Janvier–Décembre), champ numérique "Année"
- Bouton primaire "Ajouter des jours d'absence" (ouvre l'écran 3)
- Tableau, une ligne = une fiche mensuelle d'un collaborateur : Collaborateur (avatar initiales + nom), Période (ex: "Juillet 2026"), Jours justifiés (badge neutre, ex: "2 justifiés"), Jours injustifiés (badge rouge si > 0, ex: "1 injustifié"), Total jours, Action "Voir le détail"
- Pagination simple (Précédent / Page X sur Y / Suivant — pas de compteur "sur N éléments" nécessaire ici)
- État vide : "Aucune fiche d'absence enregistrée pour ces critères."

## Écran 2 : Détail d'une fiche mensuelle (un collaborateur, un mois)

- Breadcrumb "Absences > {Collaborateur} > {Mois} {Année}"
- Carte résumé en haut : nom du collaborateur, période, compteurs "X jours justifiés" / "Y jours injustifiés" / "Z jours au total"
- Liste chronologique des jours du mois (une ligne par jour d'absence enregistré) : date formatée, badge "Justifiée" (vert/neutre) ou "Injustifiée" (rouge), un toggle ou bouton pour basculer le statut de justification, une icône de suppression par ligne
- Bouton "Ajouter un jour" en haut de la liste (ouvre un petit formulaire inline ou modal : date + case à cocher "Justifiée")
- Si la fiche n'a aucun jour : état vide "Aucune absence enregistrée pour ce mois."

## Écran 3 : Ajouter des jours d'absence

- Formulaire : select "Collaborateur", select "Mois", champ "Année"
- Un sélecteur de dates multiples (calendrier ou liste de champs date ajoutables dynamiquement, "+ ajouter une date"), chaque date avec une case à cocher "Justifiée"
- Note d'avertissement visible : "L'ajout est impossible si le salaire du mois n'est pas encore initialisé, ou s'il est déjà clôturé."
- Bouton "Enregistrer" / "Annuler"
