# Prompt Stitch — Mon compte (accès depuis l'avatar du header) — Ndolecam Admin

Tu conçois l'écran **"Mon compte"**, une page de gestion du profil de l'utilisateur actuellement connecté (pas un écran d'administration d'un autre utilisateur — c'est du self-service).

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

Pas de sidebar déplié spécifique ici — cet écran est accessible depuis le menu du profil dans le header (avatar en haut à droite), pas depuis la sidebar principale.

## Contraintes métier réelles (ne pas inventer d'autres champs)

- Champs de profil **modifiables** : `firstName`, `lastName`, `phoneNumber`, `whatsappNumber` (optionnel).
- Champs **affichés en lecture seule uniquement** : `email` (jamais modifiable via cet écran), `role` (nomRole + post, ex. "Manager — Commerce"), `status` (PENDING_VERIFICATION / ACTIVE / DEACTIVATED / ARCHIVED), `verified` (booléen), `createdAt` ("Membre depuis le ..."), `profilePicture` (afficher l'avatar existant s'il y en a un, initiales sinon — **aucun endpoint d'upload de photo n'existe**, ne pas afficher de bouton "changer la photo").
- **Pas de champ `adresse`** — bien que le formulaire backend l'accepte techniquement, l'API de lecture (`GET /auth/me`) ne le renvoie jamais, donc impossible de pré-remplir sa vraie valeur. À exclure complètement de cet écran.
- Section séparée **"Changer le mot de passe"** : `currentPassword` (mot de passe actuel), `newPassword` (nouveau, min. 8 caractères). Une confirmation du nouveau mot de passe est une vérification purement côté client (le backend ne connaît qu'un seul champ `newPassword`).
- Erreurs réelles possibles : mot de passe actuel incorrect (400), nouveau mot de passe identique à l'ancien (400).
- **Après un changement de mot de passe réussi, la session est invalidée côté serveur** (comportement volontaire, comme un reset par email) — l'utilisateur est automatiquement déconnecté et redirigé vers l'écran de connexion. Prévoir un message explicite à ce sujet, pas juste un toast de succès silencieux.
- Aucune suppression de compte, aucune gestion de sessions actives/appareils, aucune authentification à deux facteurs — ne pas inventer ces sections.

## Écran unique : Mon compte

- En-tête : avatar (initiales ou photo), nom complet, badge de statut (ex. "Actif"), rôle/poste
- Carte "Informations personnelles" : prénom, nom, téléphone, WhatsApp (modifiables) + email, membre depuis, rôle (lecture seule) — bouton "Enregistrer les modifications"
- Carte "Sécurité" séparée : mot de passe actuel, nouveau mot de passe, confirmation (client uniquement) — bouton "Changer le mot de passe", avec avertissement clair sur la déconnexion automatique qui va suivre
