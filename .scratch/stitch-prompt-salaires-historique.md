# Prompt Stitch — Module Salaires, Écran "Historique des paiements d'un employé" (Ndolecam Admin)

Tu conçois 1 écran pour le back-office "Ndolecam Admin" (Hoozon SARL). C'est l'historique complet des salaires **réellement versés** à un collaborateur précis, avec des filtres avancés.

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

Cet écran liste **uniquement les salaires réellement payés** à UN collaborateur précis (déjà clôturés ET avec un montant versé enregistré — pas les fiches encore ouvertes ou clôturées mais pas encore payées).

Filtres réels disponibles (tous optionnels) :
- Année
- Mois
- Montant minimum / Montant maximum (sur le montant versé)
- "Avec écart" (oui/non — un écart existe si le montant versé diffère du salaire net, ce qui est rare en pratique)
- "Fiche de paie générée" (oui/non)
- "Fiche signée par l'employé" (oui/non) — champ réel `signeeParUser` sur la fiche de paie, avec une date de signature associée
- Plage de dates de clôture (du / au)

Regroupe les 2 premiers filtres (Année, Mois) en accès direct, et les autres dans une section "Filtres avancés" repliable — ce sont beaucoup de filtres, pas la peine de tous les exposer en permanence.

Données réelles par ligne du tableau : période, salaire brut, déductions, primes, salaire net, montant versé, écart (badge si non nul), statut de la fiche de paie (Générée/Non générée), et si générée : signée ou non par l'employé, date de clôture.

Agrégats réels disponibles en haut : nombre total de paiements, total versé, total net, total déductions, total primes — calculés sur l'ensemble des résultats filtrés (pas seulement la page affichée).

## Écran : Historique des paiements d'un employé

- Breadcrumb "RH > Salaires > {Prénom Nom} > Historique des paiements"
- En-tête avec avatar initiales + nom + email du collaborateur, titre "Historique des paiements"
- Rangée de cartes agrégats : Total paiements, Total versé, Total net, Total déductions, Total primes
- Barre de filtres primaires : Année, Mois + bouton "Filtres avancés" qui déplie un panneau avec : Montant min / Montant max, select "Avec écart" (Tous/Oui/Non), select "Fiche générée" (Tous/Oui/Non), select "Fiche signée" (Tous/Oui/Non), plage de dates "Clôturé entre... et..."
- Tableau : Période, Salaire brut, Déductions, Primes, Salaire net, Montant versé, Écart (badge rouge si présent, sinon "—"), Fiche de paie (badge "Générée" + sous-badge "Signée"/"Non signée", ou "Non générée" si absente)
- Pagination classique (Précédent / Page X sur Y / Suivant, "Affichage A-B sur N paiements")
- État vide : "Aucun paiement ne correspond à ces critères."
