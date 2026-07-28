# FRONTEND_ARCHITECTURE.md — Rôle de chaque fichier

> Ce document explique à quoi sert chaque fichier du frontend React, comment ils s'articulent entre eux,
> et comment ajouter un nouveau module métier en suivant le même pattern.
> Complément de `BACKEND_CONTEXT.md` (qui décrit l'API à consommer).

---

## 1. Philosophie : architecture "feature-based"

Le code n'est **pas** organisé par type technique (`components/`, `pages/`, `hooks/` à plat), mais par **domaine
métier** (`features/auth`, plus tard `features/commerce`, `features/rh`, etc.). Chaque feature regroupe tout ce
qui la concerne : ses appels API, ses schémas de validation, son state, ses pages et ses composants.

Le dossier `shared/` contient uniquement ce qui est **transverse** à toutes les features (client HTTP, UI kit,
hooks génériques). Le dossier `app/` contient le **squelette** de l'application (routing, providers, layouts) —
la colle qui assemble les features entre elles, mais qui ne contient aucune logique métier.

```
src/
├── app/          → squelette : routing, providers globaux, layouts, guards
├── shared/       → transverse : client HTTP, UI kit, hooks génériques, helpers
└── features/     → un dossier par domaine métier (auth, dashboard, demain : users, roles, commerce, rh...)
```

**Règle à suivre pour tout nouveau module** : créer `features/<nom-du-module>/{api,schemas,pages,components,store?}`
en suivant exactement le pattern de `features/auth/` détaillé plus bas.

---

## 2. Racine du projet

| Fichier | Rôle |
|---|---|
| `package.json` | Dépendances et scripts (`dev`, `build`, `lint`, `preview`). |
| `package-lock.json` | Verrouillage des versions exactes installées — **généré automatiquement**, ne pas éditer à la main. |
| `vite.config.ts` | Config du bundler Vite : plugin React, plugin Tailwind v4, alias `@/` → `src/`, port du dev server (`5173`, doit matcher `FRONTEND_URL` côté backend). |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | Config TypeScript. `tsconfig.app.json` contient l'alias de chemins `@/*` et les règles strictes (`noUnusedLocals`, etc.). |
| `.env` / `.env.example` | `VITE_API_BASE_URL` — URL de base de l'API backend (`http://localhost:3000/api/v1`). `.env` est ignoré par git, `.env.example` sert de modèle. |
| `src/vite-env.d.ts` | Déclare le typage TypeScript de `import.meta.env.VITE_API_BASE_URL` (sinon TS ne connaît pas cette variable). |
| `src/index.css` | Point d'entrée CSS — un seul `@import "tailwindcss";` (Tailwind v4 n'a pas besoin de fichier de config séparé pour démarrer). |
| `src/main.tsx` | Point d'entrée JS de l'app — monte `<App />` dans le `<div id="root">` de `index.html`. |
| `src/App.tsx` | Racine React : empile les providers globaux (`QueryProvider` → `AuthBootstrap` → `RouterProvider`). C'est le seul fichier qui assemble tout. |
| `BACKEND_CONTEXT.md` | Référence de l'API backend (routes, DTOs, règles métier). |
| `FRONTEND_ARCHITECTURE.md` | Ce fichier. |

---

## 3. `src/app/` — le squelette de l'application

Rien ici ne connaît le détail d'un module métier ; ce dossier ne fait qu'assembler des morceaux fournis par
`features/`.

| Fichier | Rôle |
|---|---|
| `app/providers/QueryProvider.tsx` | Crée le `QueryClient` de TanStack Query (règles de retry par défaut — pas de retry sur 401/403/404) et fournit le `QueryClientProvider` + les devtools en dev. |
| `app/providers/AuthBootstrap.tsx` | Au premier chargement de l'app, appelle `GET /auth/me` (via `useMeQuery`). Affiche un spinner plein écran pendant la vérification, puis hydrate le store Zustand (`setUser`) si la session est valide, ou le vide (`clear`) sinon. **Tant que ce composant n'a pas résolu, aucune route ne s'affiche** — ça évite un flash de contenu protégé avant de savoir si l'utilisateur est connecté. |
| `app/router.tsx` | Déclare l'arbre de routes avec `createBrowserRouter` : routes publiques (`/auth/login`, `/auth/forgot-password`) sous `PublicOnlyRoute`, routes protégées (`/dashboard`) sous `ProtectedRoute` + `AppLayout`, routes neutres (`/auth/verify-email`, `/auth/reset-password` — accessibles avec ou sans session), `/forbidden` et le catch-all `*`. C'est **le seul fichier à toucher pour déclarer une nouvelle page** d'un nouveau module. |
| `app/guards/ProtectedRoute.tsx` | Wrapper de route : si `useAuthStore().status !== 'authenticated'`, redirige vers `/auth/login` (en gardant l'URL d'origine dans `location.state.from` pour y revenir après connexion). Sinon rend `<Outlet />` (les routes enfants). |
| `app/guards/PublicOnlyRoute.tsx` | L'inverse : si déjà authentifié, redirige vers `/dashboard` (évite qu'un utilisateur connecté retombe sur l'écran de login). |
| `app/guards/RequirePermission.tsx` | Guard **au niveau route** : vérifie qu'une permission RBAC précise (ex: `user:read`) est présente, sinon redirige vers `/forbidden`. À utiliser quand une page entière doit être bloquée pour un rôle. Pour cacher juste un bouton/section, préférer le hook `usePermission` (voir §5). |
| `app/layouts/AppLayout.tsx` | Layout visuel des pages protégées : en-tête avec nom de l'utilisateur connecté + bouton déconnexion, puis `<Outlet />` pour le contenu de la page. Tous les écrans "internes" (dashboard, users, commerce, rh…) s'afficheront dans ce cadre. |

---

## 4. `src/shared/` — le socle transverse

Tout ce qui est réutilisé par **plusieurs** features vit ici. Rien de spécifique à l'auth, aux users ou au
commerce ne doit s'y trouver.

| Fichier | Rôle |
|---|---|
| `shared/lib/axios.ts` | **Le fichier le plus critique du projet.** Instance axios unique (`api`), configurée avec `baseURL` (depuis `.env`) et `withCredentials: true` (indispensable : les tokens sont en cookies httpOnly, donc chaque requête doit envoyer les cookies). Deux intercepteurs de réponse : (1) déballe automatiquement l'enveloppe backend `{success, data, timestamp}` pour que chaque appel API reçoive directement la donnée utile ; (2) intercepte les `401`, tente un `POST /auth/refresh` silencieux, puis **rejoue la requête d'origine** — avec une file d'attente pour éviter de déclencher plusieurs refresh en parallèle si plusieurs requêtes échouent en même temps. Si le refresh échoue aussi, vide le store d'auth (déconnexion locale). |
| `shared/lib/errors.ts` | `getApiErrorMessage(error)` — extrait un message lisible depuis une erreur axios, en tenant compte du format d'erreur du backend (`{statusCode, message}`, `message` pouvant être une chaîne ou un tableau de messages `class-validator`). Utilisé dans tous les formulaires pour afficher l'erreur serveur. |
| `shared/hooks/usePermission.ts` | Hook `usePermission('slug:action')` → `boolean`. Version "composant" du guard `RequirePermission`, pour cacher/désactiver un bouton ou une section sans bloquer toute la route. |
| `shared/ui/Button.tsx` | Bouton générique (variantes `primary`/`secondary`/`ghost`). **Placeholder à remplacer par le composant Stitch équivalent** dès que tu me fournis cet écran. |
| `shared/ui/Input.tsx` | Champ de formulaire générique avec label + message d'erreur intégré, compatible `register()` de react-hook-form (via `forwardRef`). Même remarque : à remplacer par Stitch. |
| `shared/ui/FullscreenSpinner.tsx` | Spinner plein écran utilisé pendant le chargement initial (`AuthBootstrap`) ou la vérification d'email. |
| `shared/pages/NotFoundPage.tsx` | Page 404 générique (route `*`). |
| `shared/pages/ForbiddenPage.tsx` | Page affichée quand `RequirePermission` bloque l'accès à une route. |

---

## 5. `src/features/auth/` — le module d'authentification (référence à suivre)

C'est le **patron** à reproduire pour chaque futur module (`users`, `roles`, `commerce/articles`, etc.).

| Fichier | Rôle |
|---|---|
| `features/auth/types/auth.types.ts` | Types TypeScript alignés sur les modèles Prisma exposés par l'API (`AuthUser`, `AuthRole`, `Permission`). Contient aussi `extractPermissionSlugs()`, une fonction défensive qui lit les permissions d'un rôle quelle que soit la forme exacte renvoyée par l'API (tableau de `Permission` ou de `RolePermission`) — **à vérifier/ajuster une fois qu'on aura la vraie réponse de `/auth/me` en pratique** (voir remarque du backend sur ce point d'incertitude). |
| `features/auth/schemas/auth.schemas.ts` | Schémas Zod = **unique source de vérité** pour la validation d'un formulaire ET son typage TS (`z.infer`). `passwordSchema` encode exactement la règle du backend (8 car. min, maj+min+chiffre+spécial) pour donner un retour immédiat à l'utilisateur avant même d'appeler l'API. |
| `features/auth/store/auth.store.ts` | Store Zustand : `user`, `status` (`idle` / `authenticated` / `unauthenticated`), `permissions` (Set de slugs), et `hasPermission(slug)` qui court-circuite tout si le rôle possède `Manage_system` (super-admin, cf. §3.4 du backend). Ne stocke **aucun token** — ils sont en cookies httpOnly, invisibles pour JS. |
| `features/auth/api/auth.api.ts` | Fonctions brutes d'appel HTTP (une par endpoint `/auth/*`) — aucune logique React ici, juste axios + typage de la réponse. C'est la couche que tu modifierais si une route backend change de forme. |
| `features/auth/api/auth.queries.ts` | Hooks TanStack Query construits sur `auth.api.ts` : `useMeQuery`, `useLoginMutation`, `useLogoutMutation`, `useForgotPasswordMutation`, `useResetPasswordMutation`, `useVerifyEmailMutation`, `useResendVerificationMutation`. C'est **cette couche que les pages appellent**, jamais `auth.api.ts` directement — elle gère aussi les effets de bord (mettre à jour le store Zustand après login, invalider le cache après logout, etc.). |
| `features/auth/pages/LoginPage.tsx` | Formulaire de connexion (react-hook-form + zod + `useLoginMutation`). Redirige vers la page d'origine (`location.state.from`) ou `/dashboard` après succès. |
| `features/auth/pages/ForgotPasswordPage.tsx` | Formulaire "mot de passe oublié" — affiche toujours le même message de succès (anti-énumération côté backend, cf. §3.5). |
| `features/auth/pages/ResetPasswordPage.tsx` | Lit `?token=` dans l'URL, formulaire de nouveau mot de passe, redirige vers `/auth/login` après succès. |
| `features/auth/pages/VerifyEmailPage.tsx` | Lit `?token=` dans l'URL, déclenche automatiquement la vérification au montage (`useEffect`), affiche le statut, redirige vers `/dashboard` après succès (le backend connecte automatiquement l'utilisateur en posant les cookies). |

---

## 6. `src/features/dashboard/`

| Fichier | Rôle |
|---|---|
| `features/dashboard/pages/DashboardPage.tsx` | Page d'accueil une fois connecté — actuellement un placeholder, deviendra le vrai tableau de bord au fil des modules. |

---

## 7. Comment lire un flux de bout en bout

**Chargement initial de l'app** :
`main.tsx` → `App.tsx` → `QueryProvider` → `AuthBootstrap` (appelle `GET /auth/me` via `useMeQuery`) → pendant ce
temps `FullscreenSpinner` → une fois résolu, hydrate `auth.store` → `RouterProvider` évalue `router.tsx` →
`ProtectedRoute`/`PublicOnlyRoute` lisent `auth.store.status` pour décider où rediriger.

**Connexion** :
`LoginPage` (formulaire validé par `loginSchema`) → `useLoginMutation` → `authApi.login` → `POST /auth/login`
via l'instance `api` (cookies posés par le navigateur automatiquement) → `onSuccess` met à jour `auth.store` →
`LoginPage` navigue vers `/dashboard`.

**Requête protégée qui expire** :
N'importe quel appel `api.get(...)` reçoit un `401` → intercepteur de `axios.ts` tente `POST /auth/refresh` →
si ça réussit, rejoue la requête d'origine (transparent pour le composant) ; si ça échoue, vide `auth.store` →
`ProtectedRoute` redirige vers `/auth/login` au prochain rendu.

---

## 8. Pattern à suivre pour un nouveau module (ex: `users`)

1. `features/users/types/user.types.ts` — types alignés sur le DTO backend.
2. `features/users/schemas/user.schemas.ts` — schémas Zod (`createUserSchema`, `updateUserSchema`...).
3. `features/users/api/users.api.ts` — fonctions axios brutes (une par endpoint `/users/*`).
4. `features/users/api/users.queries.ts` — hooks TanStack Query (`useUsersQuery`, `useCreateUserMutation`...).
5. `features/users/pages/*.tsx` — écrans (liste, détail, création...), construits avec les composants Stitch
   une fois fournis, branchés sur les hooks de l'étape 4.
6. Déclarer les routes dans `app/router.tsx`, protégées par `RequirePermission` avec le bon slug
   (`user:read`, `user:create`...).
