# Prompt Stitch — Module Rapports RH (Ndolecam Admin)

Tu conçois 3 écrans pour le back-office "Ndolecam Admin" (Hoozon SARL). Le module concerné est **Rapports RH** : génération et historique de documents PDF/Excel compilant des données RH (absences/retards, masse salariale, contrats CDD arrivant à échéance).

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles, Contrats, Absences, Retards, Salaires, Départements) :

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

Sidebar identique (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**, sous-item actif : **Rapports**, avec Départements/Contrats/Absences/Retards/Salaires visibles aussi dans le sous-menu), TopNavBar identique.

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)


- Filtres optionnels à la génération : **mois** (1-12), **année** (2026-2030), **collaborateur ciblé** (`userId` — si vide, le rapport couvre tous les collaborateurs). Si mois+année sont fournis, la période affichée est "MM/AAAA", sinon juste l'année, sinon "global".
- La génération peut renvoyer un **avertissement non bloquant** (ex: "Clôture partielle pour 07/2026 — 3 employé(s) sur 12 sans salaire clôturé", ou "Aucun salaire initialisé pour 07/2026") — le rapport est quand même généré avec les données disponibles, l'avertissement doit être affiché clairement (bandeau orange/warning) mais n'empêche jamais le téléchargement.- Un rapport a un **type** parmi exactement trois valeurs : `ABSENCES` (regroupe en réalité absences ET retards du mois), `MASSE_SALARIALE`, `CONTRATS_CDD` (contrats CDD arrivant à échéance dans les 90 jours). Pas d'autre type.
- Un rapport a un **format d'export** : `PDF` ou `EXCEL` uniquement — le format CSV existe dans l'énumération technique mais est explicitement rejeté par le serveur ("non encore supporté"), donc **ne pas le proposer** dans les formulaires.
- Chaque rapport de l'historique a : type, période, format, date de génération, éventuellement le collaborateur ciblé (nom/email, ou "Tous les collaborateurs" si `userId` est vide), et un statut **archivé / actif**.
- **Suppression = archivage (soft delete)** : le rapport passe dans une corbeille (`estArchive: true`), son fichier physique est supprimé du disque — donc un rapport archivé **ne peut plus être téléchargé** (bouton désactivé), mais reste consultable et peut être **restauré** (l'archivage seul ne supprime pas la ligne d'historique).
- Pas de champ "titre" ou "description" libre — aucun champ n'est modifiable après génération (pas d'écran "Modifier un rapport").
- Le téléchargement se fait en flux binaire (le nom de fichier et le type MIME sont déterminés par le serveur selon le format) — traiter comme un téléchargement de blob classique.

## Écran 1 : Liste des rapports (historique)

- En-tête "Rapports RH" + sous-titre "Historique des documents générés"
- Bouton primaire "Générer un rapport"
- Filtres : type (select : Absences & Retards / Masse salariale / Contrats CDD), mois, année, toggle "Inclure les rapports archivés"
- Tableau : Type (badge coloré selon le type), Période, Collaborateur ciblé (ou "Tous"), Format (icône PDF/Excel), Date de génération, Statut (Actif / Archivé), Actions (Voir, Télécharger si actif, Archiver ou Restaurer selon le statut)
- Pagination classique (Précédent / Page X sur Y / Suivant, "Affichage A-B sur N rapports") — pas d'indicateur "page suivante disponible", juste le nombre total de pages
- État vide : "Aucun rapport ne correspond à ces critères."

## Écran 2 : Détail d'un rapport

- Breadcrumb "RH > Rapports > {Type} {Période}"
- En-tête : type du rapport (grand badge), période, statut (Actif/Archivé)
- Bandeau d'avertissement si le rapport a été généré avec des données partielles (texte réel stocké au moment de la génération — si absent, ne rien afficher)
- Carte "Informations" : format d'export, collaborateur ciblé (ou "Tous les collaborateurs"), date de génération, généré par (nom de l'admin, si disponible)
- Bouton "Télécharger" (désactivé + tooltip explicatif si le rapport est archivé, car le fichier physique n'existe plus)
- Bouton "Archiver" (ou "Restaurer" si déjà archivé)

## Écran 3 : Générer un rapport

- Formulaire centré, une seule carte
- Champ "Type de rapport" (select obligatoire, 3 options)
- Champs "Mois" et "Année" (optionnels, côte à côte)
- Champ "Collaborateur" (select optionnel, "Tous les collaborateurs" par défaut)
- Champ "Format d'export" (PDF ou Excel uniquement, obligatoire)
- Note d'aide expliquant qu'un avertissement peut apparaître si les données du mois ne sont pas encore clôturées, mais que le rapport sera généré quand même
- Bouton "Générer" — après succès, redirection vers le détail du rapport généré (avec l'avertissement affiché s'il y en a un)