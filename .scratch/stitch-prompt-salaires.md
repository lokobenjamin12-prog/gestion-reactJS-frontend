# Prompt Stitch — Module Salaires, Écrans 1 & 2 (Ndolecam Admin)

Tu conçois 2 écrans pour le back-office "Ndolecam Admin" (Hoozon SARL). Le module concerné est **Salaires** : gestion de la paie mensuelle des collaborateurs (calcul, primes, clôture, versement, fiche de paie).

Réutilise EXACTEMENT le même design system Material 3 que les écrans précédents (Users, Roles, Contrats, Absences, Retards) :

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

Sidebar identique (Dashboard, Users, Roles, Commerce, RH — onglet actif : **RH**, sous-item actif : **Salaires**, avec Contrats/Absences/Retards visibles aussi dans le sous-menu), TopNavBar identique (recherche, notifications, settings, avatar, Logout). Devise : FCFA.

## Contraintes métier réelles à respecter (ne pas inventer d'autres champs)

Un salaire mensuel a exactement ces champs réels :
- `nbJoursOuvrables` (jours ouvrables du mois), `prixJournalier` (= salaireBrut / nbJoursOuvrables), `salaireBrut` (snapshot du salaire de base au moment de l'initialisation)
- `nbAbsJust` / `nbAbsInjust` / `deductionAbs` — calculés uniquement **à la clôture**, à partir du module Absences
- `nbRetardsJust` / `nbRetardsInjust` / `deductionRetards` — calculés uniquement **à la clôture**, à partir du module Retards
- `totalDeductions`, `totalPrimes`, `salaireNet` (= brut − déductions + primes)
- `primes` : liste de `{somme, raison}` — ajoutables/supprimables librement **tant que le salaire n'est pas clôturé**
- `montantVerse` et `ecart` : `null` tant qu'aucun versement n'est enregistré
- `estCloture` (booléen) et `dateCloture`

Règles à respecter strictement dans l'UI :
- **Avant clôture** : les compteurs d'absences/retards affichent 0 (ils ne sont calculés qu'à la clôture) — ne pas laisser croire qu'ils sont déjà connus avant ce moment
- **Clôturer un mois est irréversible** : ça fige tout, bloque l'ajout/suppression de primes. Doit être une action avec confirmation explicite
- **Le versement n'est possible qu'après clôture**, et surtout : **le montant versé doit être exactement égal au salaire net calculé** — le serveur rejette toute autre valeur. Ce n'est donc pas un champ libre à saisir "à l'aveugle" : l'écran doit clairement pré-afficher le montant net attendu et le présenter comme une confirmation de paiement de ce montant précis, pas une saisie arbitraire
- **La fiche de paie PDF ne peut être générée qu'après clôture**, une seule fois par salaire (le serveur refuse une deuxième génération), et demande une date de paiement (qui ne peut pas être dans le futur)
- Pas de workflow d'approbation, pas de "brouillon" — chaque action (prime, clôture, versement) s'applique immédiatement

## Écran 1 : Liste des salaires

- En-tête "Salaires" + sous-titre "Gestion de la paie mensuelle des collaborateurs"
- Filtres : select "Collaborateur", select "Mois", champ "Année", select "Statut" (Tous / Ouvert / Clôturé)
- Bouton primaire "Initialiser un salaire" (visible mais peut être marqué comme prochainement actif)
- Tableau : Collaborateur (avatar initiales + nom), Période, Salaire brut, Déductions, Primes, **Salaire net** (mis en avant, gras), Statut (badge "Ouvert" gris / "Clôturé" avec icône cadenas), Action "Voir le détail"
- Pagination complète (Précédent / Page X sur Y / Suivant, avec "Affichage A-B sur N fiches")
- État vide : "Aucune fiche de salaire enregistrée pour ces critères."

## Écran 2 : Détail d'une fiche de salaire

- Breadcrumb "Salaires > {Collaborateur} > {Mois} {Année}"
- En-tête : nom + poste du collaborateur, badge de statut (Ouvert/Clôturé), bouton "Clôturer le mois" (rouge, avec confirmation, désactivé si déjà clôturé)
- Carte "Base de calcul" : jours ouvrables, prix journalier, salaire brut
- Carte "Déductions" : justifiées/injustifiées pour absences et retards séparément, avec les montants déduits — afficher clairement "Calculé à la clôture" si le salaire n'est pas encore clôturé (valeurs à 0)
- Carte "Primes" : liste des primes (montant + raison), bouton "Ajouter une prime" (formulaire montant + raison), icône supprimer par ligne — le tout désactivé si clôturé
- Carte "Résultat" mise en avant : salaire net en gros, avec le détail du calcul (brut − déductions + primes)
- Section "Versement" (visible seulement si clôturé) : si pas encore versé, bouton "Confirmer le versement de {salaireNet} FCFA" (pas un champ libre) ; si déjà versé, afficher le montant versé et la date
- Section "Fiche de paie" (visible seulement si clôturé) : si pas encore générée, formulaire "Date de paiement" + bouton "Générer la fiche de paie" ; si déjà générée, afficher la date de génération + bouton "Télécharger le PDF"
- Liens vers les fiches Absences/Retards du même mois pour ce collaborateur (une fois clôturé, elles sont rattachées au salaire)
