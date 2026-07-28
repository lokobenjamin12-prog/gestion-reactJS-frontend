# Prompt Stitch — Module Contrats & Alertes RH (Ndolecam Admin)

Tu es en train de concevoir 5 écrans pour le back-office "Ndolecam Admin" (Hoozon SARL), un système de gestion RH/commerce. Le module concerné est **Contrats** : gestion des contrats de travail (CDI/CDD) des collaborateurs et des alertes automatiques d'expiration de CDD.

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles) :

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

Sidebar identique aux écrans précédents (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**), TopNavBar identique (recherche, notifications, settings, avatar, Logout). Police Inter pour le texte, JetBrains Mono pour les labels/badges, icônes Material Symbols Outlined.

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)

Un contrat a :
- `type` : `CDI` ou `CDD` (enum, pas d'autre valeur possible)
- `dateDebut` : date de prise d'effet (obligatoire, toujours)
- `dateFin` : date de fin — **obligatoire si CDD**, **interdite si CDI** (un CDI n'a jamais de date de fin)
- `userId` → un collaborateur (affiché via nom/prénom/email, pas de champ libre)
- `deletedAt` : présence = contrat archivé (soft-delete)
- `alertes[]` : historique en lecture seule d'alertes système envoyées à 30/15/7 jours avant l'échéance d'un CDD (`delaiJours`, `estEnvoyee`, `envoyeeAt`) — générées automatiquement par un cron, **jamais créées manuellement**, donc aucun bouton "ajouter une alerte"

Règles à refléter dans l'UI :
- Un CDI ne peut **jamais** être modifié après création (aucun champ éditable) → sur un CDI, le bouton "Modifier" doit être visiblement désactivé avec un tooltip explicite
- Un CDD ne peut être modifié que sur sa **date de fin** (rien d'autre) — l'écran de modification doit donc être minimal
- On ne peut créer un contrat que pour un collaborateur **non archivé**

---

## Écran 1 : Liste des contrats

- En-tête "Contrats & Alertes RH" + sous-titre + bouton primaire "Nouveau contrat" (icône `add`)
- Un bandeau/carte cliquable mettant en avant le nombre de CDD arrivant à échéance sous 30 jours (ex: "3 CDD expirent bientôt →"), qui renvoie vers l'écran 5
- Barre de filtres : select "Collaborateur" (liste des users), select "Type" (Tous / CDI / CDD)
- Tableau avec colonnes : Collaborateur (avatar initiales + nom + email), Type (badge coloré — CDI en bleu `primary-container`, CDD en orange `tertiary-container`), Date début, Date fin (tiret "—" si CDI), Statut (badge "Actif" ; si CDD et échéance proche, badge "Expire bientôt" en `error-container`, calculé côté front à partir de `dateFin`), Actions (icônes Voir / Modifier — désactivée si CDI / Archiver)
- Pagination classique en bas (Précédent/Suivant + numéros de page)
- État vide : "Aucun contrat enregistré."

## Écran 2 : Détail d'un contrat

- Breadcrumb "Contrats > Détail"
- Carte "Informations du contrat" : type (badge), date début, date fin (ou "Aucune — CDI"), statut
- Carte "Collaborateur" : avatar initiales, nom complet, email, lien vers la fiche utilisateur
- Carte "Historique des alertes" (lecture seule) : liste chronologique des alertes envoyées avec délai (30/15/7 jours), date d'envoi réelle, icône `notifications_active`. Si aucune alerte : "Aucune alerte envoyée pour ce contrat."
- Actions en en-tête : "Modifier" (désactivé + tooltip si CDI), "Archiver" (bouton danger)

## Écran 3 : Créer un contrat

- Formulaire simple, une seule carte :
  - Select "Collaborateur" (uniquement utilisateurs actifs)
  - Select "Type de contrat" (CDI / CDD)
  - Champ date "Date de début"
  - Champ date "Date de fin" — **affiché uniquement si CDD est sélectionné** (logique conditionnelle visible dans le prototype : le champ apparaît/disparaît selon le type choisi), avec une note "Obligatoire pour un CDD"
- Boutons Annuler / Créer le contrat

## Écran 4 : Modifier un contrat (CDD uniquement)

- Formulaire volontairement minimal : les infos du contrat (collaborateur, type, date début) sont affichées en **lecture seule**, seul le champ "Nouvelle date de fin" est éditable
- Note explicative : "Seule la date de fin d'un CDD peut être modifiée."
- Boutons Annuler / Enregistrer

## Écran 5 : Alertes CDD — Expirations proches

- En-tête "Alertes CDD" + un champ pour ajuster le seuil en jours (par défaut 30)
- Liste/cartes des contrats CDD concernés, triés par urgence : collaborateur, date de fin, nombre de jours restants, badge urgence (rouge si < 7 jours, orange si < 15 jours, jaune si < 30 jours)
- Chaque ligne cliquable vers le détail du contrat (écran 2)
- État vide : "Aucun CDD n'arrive à échéance dans ce délai."
