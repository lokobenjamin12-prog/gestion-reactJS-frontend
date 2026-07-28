# TODO — Backend

Fichier de suivi des endpoints/actions attendus côté backend, identifiés pendant le développement du frontend, mais pas encore implémentés. Un point par section ; complète au fur et à mesure.

---

## Désactivation d'un compte utilisateur (distinct de l'archivage)

**Statut** : non implémenté. Le bouton "Désactiver le compte" existe déjà côté frontend (`UserDetailPage.tsx`, section "Zone de danger") mais reste désactivé (`disabled`) faute de route backend.

**Endpoint attendu** : quelque chose comme `PATCH /users/:id/deactivate` (+ un `PATCH /users/:id/reactivate` symétrique pour lever la suspension), avec une permission dédiée (ex: `user:deactivate`), sur le modèle de `PATCH /users/archive/:id` / `PATCH /users/:id/restore`.

### Contexte / cas d'usage — pourquoi ce n'est PAS la même chose qu'archiver

Le modèle `User` a déjà les champs nécessaires pour cette distinction (`active: Boolean`, `status: AccountStatus` avec une valeur `DEACTIVATED` séparée de `ARCHIVED`), et `login()` vérifie déjà les deux indépendamment (`!user.active || user.status === AccountStatus.DEACTIVATED`) — donc le blocage de connexion fonctionne déjà pour un compte désactivé. Ce qui manque, c'est uniquement **le moyen de faire passer le compte dans cet état** depuis l'interface admin.

| | **Archiver** (déjà implémenté) | **Désactiver** (à faire) |
|---|---|---|
| Sémantique | Fin de vie du compte — l'employé a quitté, poste supprimé | Suspension temporaire — accès bloqué sans clôturer le dossier |
| Champ modifié | `estArchive: true` | `active: false` et/ou `status: DEACTIVATED` |
| Effet immédiat | Révoque toutes les sessions actives (déconnexion forcée) — déjà le comportement de `PATCH /users/archive/:id` | Devrait probablement aussi révoquer les sessions actives (mêmes raisons) |
| Réversibilité | `PATCH /users/:id/restore` (ne rétablit pas de session, reconnexion manuelle requise) | Un endpoint de réactivation symétrique, à définir |
| Cas d'usage type | Départ de l'entreprise, erreur de création de compte | Suspicion de faute, enquête en cours, congé disciplinaire, mesure conservatoire le temps d'une vérification |

**Question ouverte à trancher côté backend** : faut-il piloter ça via `active` seul, `status` seul, ou les deux en même temps ? Et faut-il aussi invalider `accessToken`/`refreshToken` en base comme le fait l'archivage (cohérence avec le comportement déjà décrit dans `BACKEND_CONTEXT.md` §3) ?

**Frontend prêt à brancher** : dès que l'endpoint existe, il suffit de créer une mutation `useDeactivateUserMutation` (même pattern que `useArchiveUserMutation` dans `features/users/api/users.queries.ts`) et de retirer le `disabled` du bouton dans `UserDetailPage.tsx`.
