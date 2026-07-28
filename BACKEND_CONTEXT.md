# BACKEND_CONTEXT.md — Contexte backend pour le développement du frontend React

> Document généré par analyse statique du code source de `backend/` (NestJS 11 + Prisma 7 + PostgreSQL).
> Objectif : donner à l'équipe frontend tout ce qu'il faut savoir pour consommer l'API sans avoir à relire le code serveur.

---

## Table des matières

1. [Vue d'ensemble & stack technique](#1-vue-densemble--stack-technique)
2. [Architecture du backend](#2-architecture-du-backend)
3. [Système d'authentification & gestion des tokens](#3-système-dauthentification--gestion-des-tokens)
4. [Schéma de base de données (Prisma complet)](#4-schéma-de-base-de-données-prisma-complet)
5. [Endpoints de l'API](#5-endpoints-de-lapi)
   - [5.1 Auth — Authentification](#51-auth--authentification-apiv1auth)
   - [5.2 Auth — Utilisateurs](#52-auth--utilisateurs-apiv1users)
   - [5.3 Auth — Rôles](#53-auth--rôles-apiv1roles)
   - [5.4 Auth — Permissions](#54-auth--permissions-apiv1permissions)
   - [5.5 Auth — Logs](#55-auth--logs-apiv1auth-logs)
   - [5.6 Commerce — Articles](#56-commerce--articles-apiv1articles)
   - [5.7 Commerce — Catégories (formats)](#57-commerce--catégories-formats-apiv1categories)
   - [5.8 Commerce — Mouvements de stock](#58-commerce--mouvements-de-stock-apiv1movement-stock)
   - [5.9 Commerce — Sessions de vente](#59-commerce--sessions-de-vente-apiv1sales-sessions)
   - [5.10 Commerce — Entreprise](#510-commerce--entreprise-apiv1entreprise)
   - [5.11 Commerce — Logs](#511-commerce--logs-apiv1commerce-logs)
   - [5.12 RH — Absences](#512-rh--absences-apiv1absences)
   - [5.13 RH — Retards](#513-rh--retards-apiv1retards)
   - [5.14 RH — Salaires & paie](#514-rh--salaires--paie-apiv1salaires)
   - [5.15 RH — Contrats](#515-rh--contrats-apiv1contrats)
   - [5.16 RH — Départements](#516-rh--départements-apiv1departments)
   - [5.17 RH — Rapports](#517-rh--rapports-apiv1rapports)
   - [5.18 RH — Logs](#518-rh--logs-apiv1rh-logs)
   - [5.19 Admin — Health](#519-admin--health-apiv1health)
6. [Règles métier & contraintes importantes](#6-règles-métier--contraintes-importantes)
7. [Anomalies connues / points d'attention pour le frontend](#7-anomalies-connues--points-dattention-pour-le-frontend)

---

## 1. Vue d'ensemble & stack technique

**Projet** : Ndolecam (client final : Hoozon SARL) — un back-office combinant :
- un **module RH** (employés, contrats, absences, retards, paie, fiches de paie, rapports),
- un **module Commerce** (catalogue d'articles/stocks, ventes terrain via "sessions commerciales", entreprise),
- un **module Auth** (utilisateurs, rôles, permissions, authentification par cookies JWT),
- des **logs d'audit** séparés par domaine (auth, commerce, RH).

**Stack** :
- NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/schedule`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/swagger`, `@nestjs/terminus`)
- Prisma 7 + adaptateur `@prisma/adapter-pg` (PostgreSQL, pool `pg`)
- `passport` + `passport-jwt` (une stratégie `jwt` déclarée mais non utilisée en pratique — voir §3 — et une stratégie `jwt-refresh` utilisée pour `/auth/refresh`)
- `bcrypt` (hachage mots de passe et tokens, 12 rounds)
- `class-validator` / `class-transformer` (validation globale des DTO)
- `helmet` (sécurité headers HTTP), `cookie-parser` (lecture des cookies signés)
- `nodemailer` (envoi d'emails via SMTP Mailtrap en dev)
- `pdfkit` (génération de PDF : fiches de paie, rapports) et `exceljs` (génération de fichiers Excel)
- `@nestjs/schedule` (CRON — alertes CDD quotidiennes)
- Tests : Jest (unitaires `.spec.ts` colocalisés) + Supertest (e2e)

**Configuration serveur (`main.ts`)** :
- Préfixe global : **`/api/v1`** — toutes les routes ci-dessous doivent être préfixées ainsi.
- `ValidationPipe` global : `whitelist: true`, `forbidNonWhitelisted: true` (tout champ non déclaré dans le DTO fait échouer la requête avec 400), `transform: true`, `enableImplicitConversion: true`.
- CORS : `origin: process.env.FRONTEND_URL` (donc **une seule origine autorisée**, doit matcher exactement l'URL du frontend), `credentials: true` (obligatoire pour que les cookies soient envoyés/reçus en cross-origin).
- `helmet()` activé mais avec la plupart des protections désactivées explicitement (CSP, COEP, CORP, HSTS, etc. tous à `false`) — configuration à durcir avant mise en production.
- Un middleware de debug loggue à la console, pour **chaque requête**, la présence du cookie `__Host-psid` et du header `x-csrf-token` — la protection CSRF (`csrf-csrf`) est présente en dépendance mais **commentée/désactivée** dans le code actuel (pas de vérification CSRF active).
- Port : `process.env.PORT` (défaut 3000).

**Format de réponse standard (succès)** — appliqué automatiquement par un `ResponseInterceptor` global à **toutes** les routes :
```json
{
  "success": true,
  "data": { /* ce que le controller retourne */ },
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```
⚠️ Le frontend doit donc systématiquement déballer `response.data.data` pour obtenir la charge utile réelle.

**Format de réponse standard (erreur)** — appliqué par un `HttpExceptionFilter` global :
```json
{
  "statusCode": 400,
  "timestamp": "2026-07-09T12:00:00.000Z",
  "path": "/api/v1/auth/login",
  "method": "POST",
  "message": "Identifiants invalides"
}
```
(`message` peut être une chaîne ou un tableau de messages de validation `class-validator` selon le type d'erreur.)

---

## 2. Architecture du backend

Structure des dossiers (`backend/src/`) :

```
src/
├── main.ts                     # Bootstrap Nest, Helmet, CORS, ValidationPipe, prefix /api/v1
├── app.module.ts                # Module racine — assemble tous les modules métier + guards/filtres globaux
├── prisma/                      # PrismaService (client Prisma injectable) + PrismaController (santé DB)
├── common/
│   ├── customValidators/        # @IsPasswordMatch, @IsPasswordStrong (class-validator custom)
│   ├── decorators/               # @GetUser(), @RequireContratSelf/Both/Actor()
│   ├── filters/                  # HttpExceptionFilter (global)
│   ├── guards/                   # ContratGuard (global)
│   └── interceptors/              # ResponseInterceptor (global)
└── modules/
    ├── auth/
    │   ├── authentification/     # login/register/refresh/logout/verify/reset (voir §3)
    │   ├── user/                 # CRUD employés (hors création — via register)
    │   ├── role/                 # CRUD rôles + gestion des permissions par rôle
    │   ├── permission/           # CRUD permissions système (slugs)
    │   └── log/                  # AuthLog (journal d'audit auth)
    ├── commerce/
    │   ├── stocks/                # Article / Category (formats) / ArticleStock / MovementStock
    │   ├── sales-session/         # Sessions de vente terrain (commercial ↔ manager)
    │   ├── entreprise/            # Config entreprise (singleton) + logo
    │   └── log/                   # CommerceLog
    ├── rh/
    │   ├── absence/               # Gestion des absences mensuelles
    │   ├── retard/                # Gestion des retards mensuels
    │   ├── salaire/                # Paie : initialisation, primes, clôture, versement, fiche de paie
    │   ├── contrat/                # Contrats CDI/CDD + cron d'alertes d'expiration
    │   ├── department/             # Départements (rattachés aux rôles)
    │   ├── rapport/                 # Génération de rapports PDF/Excel
    │   └── log/                    # RhLog
    ├── admin/
    │   ├── pdf-generator/           # Service pur (pas de controller) — génère PDF fiches de paie & rapports
    │   ├── excel-generator/         # Service pur (pas de controller) — génère classeurs Excel
    │   └── health/                  # /health — Terminus (DB, mémoire, disque)
    └── core/                        # Module vide (placeholder)
```

**Guards enregistrés globalement (`app.module.ts`, via `APP_GUARD`)**, appliqués dans cet ordre à **toutes** les routes, sauf indication contraire :
1. **`AuthGuard`** (custom, PAS le guard Passport standard) — vérifie la présence et la validité du cookie `access_token` (voir §3). Contournable route par route avec `@Public()`.
2. **`ContratGuard`** — vérifie qu'un contrat actif existe pour l'utilisateur concerné, mais **seulement sur les routes décorées** avec `@RequireContratSelf()`, `@RequireContratBoth()` ou `@RequireContratActor()` (no-op sinon).

**`PermissionsGuard` n'est PAS un guard global.** Il doit être ajouté explicitement sur chaque contrôleur avec `@UseGuards(AuthGuard, PermissionsGuard)`. La quasi-totalité des contrôleurs métier le font, **mais pas les trois contrôleurs de logs** (`auth-logs`, `commerce-logs`, `rh-logs`) — voir §7 pour les implications.

**Intercepteur & filtre globaux** : `ResponseInterceptor` (enveloppe `{success, data, timestamp}`) et `HttpExceptionFilter` (formatage des erreurs) — voir §1.

**Décorateurs transverses utiles côté compréhension API** :
- `@Public()` — désactive `AuthGuard` pour la route (aucun cookie requis).
- `@RequirePermissions('ressource:action', ...)` — nécessite que le rôle de l'utilisateur possède **tous** les slugs listés (sauf bypass `Manage_system`, voir §3). N'a d'effet que si `PermissionsGuard` est bien monté sur le contrôleur.
- `@RequireContratSelf()` / `@RequireContratBoth()` / `@RequireContratActor()` — voir §3.4.
- `@GetUser('sub' | 'email' | 'nomrole' | ...)` — injecte un champ du payload JWT décodé (`request.user`) dans un paramètre de méthode de contrôleur.
- `@Roles(...)` + `RolesGuard` — **existent dans le code mais ne sont utilisés/montés nulle part** (dead code, voir §7). Ne pas s'y fier pour un contrôle d'accès basé sur les rôles Prisma (`Role` enum) — le contrôle réel se fait via `@RequirePermissions`.

---

## 3. Système d'authentification & gestion des tokens

C'est la partie la plus critique à bien comprendre côté frontend.

### 3.1 Principe général : tokens en cookies httpOnly, pas en headers

> Commentaire laissé dans le code source (`main.ts`) : *« les tokens ne sont stockés ni dans les entêtes (Bearer) mais dans les cookies (l'onglet Cookies) »*.

- **`access_token`** : JWT signé avec `JWT_SECRET`, durée de vie **15 minutes** (`JWT_EXPIRATION=15m`).
- **`refresh_token`** : JWT signé avec `JWT_REFRESH_SECRET`, durée de vie **7 jours** (`JWT_REFRESH_SECRET_EXPIRATION=7d`).
- Les deux sont posés par le serveur via `Set-Cookie` avec les options :
  ```js
  { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' }
  ```
  → **Le frontend ne peut PAS lire ces cookies en JavaScript** (httpOnly). Il n'y a rien à stocker côté client (pas de `localStorage`/`sessionStorage` à gérer pour les tokens).
- **Conséquence directe pour le frontend** : toutes les requêtes vers l'API doivent être faites avec `credentials: 'include'` (fetch) ou `withCredentials: true` (axios), sinon les cookies ne seront jamais envoyés/reçus. Le CORS backend est configuré pour n'accepter qu'une seule origine (`FRONTEND_URL`) avec `credentials: true` — vérifier que l'URL du dev server frontend correspond exactement à cette variable d'environnement (`.env` backend : `FRONTEND_URL=http://localhost:5173`).
- Payload JWT (access et refresh) : `{ sub: userId, email, nomrole }` où `nomrole` = `Role.nomRole` (ex: `Manager_Direction_Générale`), pas un enum fixe.

### 3.2 Double vérification en base (révocation immédiate possible)

Le hash bcrypt de **chaque** token (access ET refresh) est stocké en base sur `User.accessToken` / `User.refreshToken`. À chaque requête protégée, `AuthGuard` :
1. Vérifie la signature/expiration du JWT du cookie `access_token`.
2. Recharge l'utilisateur en base et compare (bcrypt) le token présenté au hash stocké.
3. Si absent en base (déconnexion, ou remplacé par une rotation) ou différent → `401 Unauthorized`, même si le JWT est cryptographiquement valide.

Cela permet une **révocation immédiate** (logout, désactivation de compte, rotation) sans attendre l'expiration naturelle du JWT — mais impose un aller-retour DB sur chaque requête authentifiée.

Si le `accessToken` présenté lors d'un `/auth/refresh` ne correspond pas à celui stocké en base pour l'utilisateur du `refresh_token`, ou si le `refreshToken` ne correspond pas non plus, le service **invalide immédiatement les deux tokens en base** (`accessToken: null, refreshToken: null`) — traité comme une alerte de sécurité potentielle (vol de session), le prochain appel forcera une reconnexion complète.

### 3.3 Flux d'authentification complet

```
1. (Admin connecté) POST /auth/register  →  crée un employé, envoie un email de vérification
2. GET /auth/verify-email?token=...      →  active le compte + pose les cookies (connecte automatiquement)
   — OU directement —
3. POST /auth/login                       →  vérifie email+password, pose les cookies access_token/refresh_token
4. Toute requête protégée                 →  cookie access_token lu automatiquement par le navigateur
5. Quand l'access_token expire (401)      →  POST /auth/refresh (utilise le cookie refresh_token) → nouveaux cookies
6. POST /auth/logout                      →  invalide les tokens en base + supprime les cookies
```

**Point important : il n'y a pas d'auto-inscription publique.** `POST /auth/register` est protégé par `AuthGuard + PermissionsGuard` et exige la permission `authentification:create` — **seul un administrateur déjà connecté peut créer un nouvel utilisateur** (ex: un manager RH crée les comptes employés). Le frontend doit donc prévoir un écran "Créer un employé" réservé aux admins, pas un formulaire d'inscription public. Il n'existe pas non plus de route `POST /users` de création — `register` est le seul point de création d'utilisateur.

Un compte fraîchement créé a `verified: false` et `status: PENDING_VERIFICATION` — **le login échoue tant que l'email n'est pas vérifié** (401 avec message explicite).

### 3.4 Système de rôles / permissions (RBAC) et garde métier "contrat actif"

- **Rôle (`Role`)** : rattaché à un `Department`. Son `nomRole` est **généré automatiquement côté serveur** avec la règle `{post}_{department.name}` (espaces → `_`) — ne jamais l'envoyer depuis le front lors de la création/modification d'un rôle.
- **Permission (`Permission`)** : un slug au format `ressource:action` (ex: `article:create`, `salaire:update`, `absence:read`). Rattachées aux rôles via la table pivot `RolePermission`.
- **`PermissionsGuard`** (non global, monté par contrôleur) : lit les slugs requis via `@RequirePermissions(...)`, charge le rôle de l'utilisateur (`user.nomrole` du JWT) avec ses permissions, et vérifie que tous les slugs requis sont présents.
  - **Bypass total** : si le rôle possède le slug `Manage_system`, **tous** les contrôles de permissions sont court-circuités (accès total, "super admin"). Le seed initial (`prisma/seed.ts`) crée exactement ce rôle (`Manager_Direction Générale`) avec cette permission pour le premier compte admin (`lokobenjamin12@gmail.com`).
- **`ContratGuard`** (global, no-op sauf décoration explicite) — vérifie qu'un **contrat actif** existe (type `CDI`, ou `CDD` avec `dateFin >= now()`, et `deletedAt: null`) avant d'autoriser certaines actions métier (indépendant des permissions RBAC) :
  - `@RequireContratSelf()` : vérifie seulement l'employé **cible** de l'action.
  - `@RequireContratActor()` : vérifie seulement l'**acteur** (l'admin/utilisateur connecté, via le JWT).
  - `@RequireContratBoth()` : vérifie **les deux**.
  - Cible résolue dans cet ordre : `body.userId` → `params.userId` → `params.id` → `body.commercialId` → sinon l'acteur lui-même.
  - Absence de contrat actif valide → `400 Bad Request` avec message explicite ("L'employé cible ne possède pas de contrat actif...").

### 3.5 Endpoints — `/api/v1/auth`

Toutes les routes ci-dessous sont sous préfixe `/api/v1/auth`.

| Méthode & route | Accès | Description |
|---|---|---|
| `POST /auth/register` | `AuthGuard + PermissionsGuard`, requiert `authentification:create` | Crée un nouvel utilisateur (par un admin connecté) |
| `GET /auth/verify-email?token=...` | `@Public()` | Active le compte, pose les cookies, retourne l'utilisateur |
| `POST /auth/resend-verification` | `@Public()` | Renvoie l'email de vérification |
| `POST /auth/login` | `@Public()` | Connexion, pose les cookies |
| `POST /auth/refresh` | `@Public()` + `RefreshTokenGuard` (lit le cookie `refresh_token`) | Rotation des deux tokens |
| `POST /auth/forgot-password` | `@Public()` | Envoie un lien de reset (réponse générique anti-énumération) |
| `POST /auth/reset-password` | `@Public()` | Réinitialise le mot de passe via token |
| `POST /auth/logout` | `AuthGuard` | Invalide les tokens en base + efface les cookies |
| `GET /auth/me` | `AuthGuard` | Profil de l'utilisateur connecté |

#### Détails champ par champ

**`POST /auth/register`** — body `CreateUserDto` :
| Champ | Type / contraintes |
|---|---|
| `email` | `string`, format email, requis |
| `password` | `string`, min 8, doit contenir maj + min + chiffre + caractère spécial (`@$!%*?&`) |
| `firstName`, `lastName`, `phoneNumber` | `string`, requis |
| `whatsappNumber` | `string`, optionnel |
| `roleId` | `number` entier positif, requis (ID d'un `Role` existant) |
| `dateNaissance`, `dateRecrutement` | `string` ISO date, optionnels |
| `adresse` | `string`, optionnel |
| `salaireBase` | `number`, optionnel |
| `typeHoraire` | enum `JOUR \| NUIT \| MIXTE`, optionnel |
| `quotaCongesAnnuel` | `number`, optionnel |

Réponse `201` : `{ message, user }` (`user` sans `password`/tokens/emailToken).

**`GET /auth/verify-email`** — query `{ token: string (requis) }`.
Réponse `200` : `{ message, user: { id, email, firstName } }` + cookies `access_token`/`refresh_token` posés.

**`POST /auth/resend-verification`** — body `{ email: string (email valide, requis) }`. Réponse `200` : `{ message }`.

**`POST /auth/login`** — body `LoginDto` : `{ email: string (email valide), password: string (requis) }`.
Réponse `200` : `{ message, user }` où `user` = utilisateur complet **sans** `password`/`emailToken`/`emailTokenExpires` (inclut `role` avec ses champs). Cookies posés. Erreurs possibles (`401`) : email inconnu, mot de passe incorrect, email non vérifié, compte désactivé — toutes avec le même statut mais un message différent (pas anti-énumération ici, contrairement à forgot-password).

**`POST /auth/refresh`** — pas de body côté client requis (le controller lit directement les cookies `access_token`/`refresh_token` de la requête, `RefreshTokenGuard` valide le refresh via la stratégie Passport `jwt-refresh` qui lit aussi le cookie). Réponse `200` : `{ message: 'Session renouvelée avec succès.' }`, nouveaux cookies posés (rotation complète : ancien `accessToken` DB invalidé avant régénération).

**`POST /auth/forgot-password`** — body `{ email: string }`. Réponse `200` toujours identique (`{ message: 'Si cet email est associé à un compte, vous recevrez un lien de réinitialisation.' }`) que l'email existe ou non (anti-énumération volontaire). Le lien envoyé pointe vers `${FRONTEND_URL}/auth/reset-password?token=...` — **le frontend doit implémenter cette route** et soumettre le token + nouveau mot de passe à `POST /auth/reset-password`. Expiration du token : **1 heure**.

**`POST /auth/reset-password`** — body `ResetPasswordDto` : `{ token: string (requis), newPassword: string (min 8, maj+min+chiffre+spécial) }`. Réponse `200` : `{ message }`. Erreurs `400` : token invalide/expiré, ou nouveau mot de passe identique à l'ancien.

**`POST /auth/logout`** — pas de body, `AuthGuard` requis. Réponse `200` : `{ message }`. Efface les cookies côté client et invalide les deux tokens en base.

**`GET /auth/me`** — `AuthGuard` requis. Réponse `200` : objet utilisateur (`id, email, firstName, lastName, phoneNumber, whatsappNumber, profilePicture, verified, role, active, status, createdAt, updatedAt`) — **sans** les données RH (salaire, congés, etc.) ni les tokens.

### 3.6 Emails envoyés automatiquement

Via `MailService` (Nodemailer, template HTML de marque "Hoozon SARL") :
- **Vérification d'email** — lien `${FRONTEND_URL}/auth/verify-email?token=...`, expire en 24h.
- **Réinitialisation de mot de passe** — lien `${FRONTEND_URL}/auth/reset-password?token=...`, expire en 1h.
- **Confirmation de changement de mot de passe** (best-effort, n'annule pas le reset si l'envoi échoue).
- **Email de bienvenue** (`sendWelcomeEmail`) — méthode disponible mais pas systématiquement appelée dans le flux `register` actuel (à vérifier si utilisée ailleurs).

Le frontend doit donc impérativement fournir les deux pages `/auth/verify-email` (lit `?token=`, appelle `GET /auth/verify-email`) et `/auth/reset-password` (lit `?token=`, formulaire nouveau mot de passe, appelle `POST /auth/reset-password`).

---

## 4. Schéma de base de données (Prisma complet)

Base : PostgreSQL, via `@prisma/adapter-pg`. Fichier source : `backend/prisma/schema.prisma`.

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Get a free hosted Postgres database in seconds: `npx create-db`

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Depense {
  id             String       @id @default(uuid())
  montant        Float
  motif          String
  createdAt      DateTime     @default(now())

  // Relations
  salesSession   SalesSession @relation(fields: [salesSessionId], references: [id], onDelete: Cascade)
  salesSessionId String
}


// ─────────────────────────────────────────────
// DEPARTMENT
// ─────────────────────────────────────────────
model Department {
  id    Int    @id @default(autoincrement())
  name  String @unique

  roles Role[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("departments")
}

// ─────────────────────────────────────────────
// PERMISSION
// ─────────────────────────────────────────────
model Permission {
  id          Int    @id @default(autoincrement())
  slug        String @unique
  description String

  roles RolePermission[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("permissions")
}

// ─────────────────────────────────────────────
// ROLE — table pivot
// ─────────────────────────────────────────────
model Role {
  id           Int    @id @default(autoincrement())
  nomRole      String @unique // généré automatiquement : {post}_{department.name}
  post         String
  departmentId Int

  department  Department       @relation(fields: [departmentId], references: [id])
  permissions RolePermission[]
  users       User[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("roles")
}

// ─────────────────────────────────────────────
// TABLE PIVOT role_permission (Many-to-Many)
// ─────────────────────────────────────────────
model RolePermission {
  roleId       Int
  permissionId Int

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@id([roleId, permissionId])
  @@map("role_permissions")

}



model Entreprise {
  id        String  @id @default(cuid())
  nom       String
  logo      String? // chemin local vers le fichier image
  adresse   String?
  telephone String?
  email     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("entreprises")
}



// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
model User {
  id             String        @id @default(cuid())
  email          String        @unique
  firstName      String
  lastName       String
  phoneNumber    String
  whatsappNumber String?
  password       String
  profilePicture String?
  verified       Boolean       @default(false)
  refreshToken   String?       @unique
  accessToken    String?       @unique  

  active         Boolean       @default(true)
  status         AccountStatus @default(PENDING_VERIFICATION)

  // Données RH
  dateNaissance     DateTime?
  dateRecrutement   DateTime    @default(now())
  adresse           String?
  salaireBase       Decimal     @default(0) @db.Decimal(12, 2)
  typeHoraire       HoraireEnum @default(JOUR)
  estArchive        Boolean     @default(false)
  soldeConges       Int         @default(0)
  quotaCongesAnnuel Int         @default(30)

  // Auth
  resetPasswordToken   String?
  resetPasswordExpires DateTime?
  emailToken           String?
  emailTokenExpires    DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  roleId Int
  role   Role @relation(fields: [roleId], references: [id])

  //Relations métier 
  contrats           Contrat[]
  absences  Absence[]
  retards   Retard[]
  salaires  Salaire[]
  rapports           Rapport[]

  mouvements         MovementStock[]
  sessionsCommercial SalesSession[] @relation("SessionCommercial")
  sessionsManager    SalesSession[] @relation("SessionManager")

  commerceLogs CommerceLog[]
  rhLogs       RhLog[] 
  authLogs     AuthLog[]  

  @@map("users")
}



// ─── Module Commercial Session ────────────────────────────────────────────────

enum SessionStatus {
  OPEN    // Session en cours — commercial sur le terrain
  CLOSED  // Session clôturée — retour effectué et comptes faits
  CANCELLED  // Session annulée 
}


model SalesSession {
  id          String        @id @default(cuid())

  // ── Qui ──────────────────────────────────────────────────────────────────
  commercialId  String
  commercial    User          @relation("SessionCommercial", fields: [commercialId], references: [id])
  managerId     String
  manager       User          @relation("SessionManager",    fields: [managerId],    references: [id])

  // ── Quel stock ────────────────────────────────────────────────────────────
  articleStockId String
  articleStock   ArticleStock  @relation(fields: [articleStockId], references: [id])

  // ── Quantités ─────────────────────────────────────────────────────────────
  quantiteDepart  Int           // stock confié au départ
  quantiteRetour  Int?          // invendus ramenés (null tant que OPEN)
  // quantiteVendue = quantiteDepart - quantiteRetour (calculé)

  // ── Timing ────────────────────────────────────────────────────────────────
  jourOuverture DateTime
  heureDepart   DateTime      @default(now())
  heureRetour   DateTime?

  // ── Finances ──────────────────────────────────────────────────────────────
  totalVentesRecues      Int?  // argent liquide remis par le commercial
  depensesImprevues      Int   @default(0)
  motifDepense           String?
  // chiffreAffaireTheorique = quantiteVendue × prixUnite  (calculé)
  // ecartCaisse = totalVentesRecues - chiffreAffaireTheorique (calculé)

  // ── Statut ────────────────────────────────────────────────────────────────
  status        SessionStatus  @default(OPEN)

  // ── Mouvements liés ───────────────────────────────────────────────────────
  mouvementDepart  MovementStock? @relation("SessionDepart",  fields: [mouvementDepartId],  references: [id])
  mouvementDepartId String?       @unique
  mouvementRetour  MovementStock? @relation("SessionRetour",  fields: [mouvementRetourId],  references: [id])
  mouvementRetourId String?       @unique

  // ── depensesImprevues  ───────────────────────────────────────────────────────
  depenses          Depense[]      // Relation
  totalDepenses     Float          @default(0) // Somme pour accès rapide


  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([commercialId])
  @@index([managerId])
  @@index([articleStockId])
  @@index([status])
}




// ─── Module Stock ─────────────────────────────────────────────────────────────
model Category {
  id          String    @id @default(cuid())
  nomUnique   String
  prixUnite   Int
  description String?
  deletedAt   DateTime? 
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
 
  articleId   String
  article     Article   @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  // NOUVEAU : Une catégorie possède maintenant ses propres lignes de stock
  stocks      ArticleStock[] 

  @@index([articleId])
}

model Article {  
  id          String    @id @default(cuid())
  nom         String    @unique
  deletedAt   DateTime? 
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  categories  Category[]
  // MODIFIÉ : Un article a plusieurs lignes de stock (une par catégorie)
  stocks      ArticleStock[] 
  mouvements  MovementStock[]
}

model ArticleStock {
  id               String        @id @default(cuid())
  quantiteActuelle Int           @default(0)
  niveauAlerte     TypeSeuil     @default(NORMAL)
  deletedAt        DateTime?    
  
  // MODIFIÉ : Relation avec l'Article (plus de @unique ici)
  articleId        String
  article          Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  // NOUVEAU : Relation avec la Catégorie
  categoryId       String
  category         Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  mouvements      MovementStock[]

  sessions  SalesSession[]

  seuilAlerte      Int           @default(20)
  seuilCritique    Int           @default(10)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // IMPORTANT : Unicité pour éviter d'avoir deux stocks pour le même article dans la même catégorie
  @@unique([articleId, categoryId]) 
  @@index([articleId])
  @@index([categoryId])
  @@index([niveauAlerte])
}

model MovementStock {
  id                     String        @id @default(cuid())
  type                   TypeMouvement
  quantiteSortieOuEntree Int
  motif                  String?
  quantiteAvant          Int
  quantiteApres          Int
  movementDate           DateTime
  isSystem               Boolean       @default(false)
  
  articleStockId         String
  articleStock           ArticleStock  @relation(fields: [articleStockId], references: [id], onDelete: Cascade)
  
  articleId              String
  article                Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  userId                 String
  user                   User          @relation(fields: [userId], references: [id])

  // --- Liens avec SalesSession ---
  sessionDepart  SalesSession? @relation("SessionDepart")  // NOUVEAU
  sessionRetour  SalesSession? @relation("SessionRetour") 


  
  createdAt              DateTime      @default(now())

  @@index([articleStockId])
  @@index([articleId])
  @@index([userId])
  @@index([movementDate])
}


// ─────────────────────────────────────────────
// ---  GESTION ABSCENCES USERS ---
// ─────────────────────────────────────────────

// Module concerné par une action dans JournalAudit
enum AuditModule {
  USER
  CONTRAT
  ABSENCE
  RETARD
  SALAIRE
  GRILLE_SANCTIONS
  FICHE_PAIE
  RAPPORT
  ROLE
  PERMISSION
  DEPARTMENT
}



model Contrat {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      ContratType
  dateDebut DateTime
  dateFin   DateTime?
  alertes   AlerteCDD[]

  deletedAt DateTime? // Si null = actif. Si renseigné = archivé/supprimé.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([type, dateFin])
  @@map("contrats")
}

model AlerteCDD {
  id         String  @id @default(cuid())
  contratId  String
  contrat    Contrat @relation(fields: [contratId], references: [id], onDelete: Cascade)
  delaiJours Int
  estEnvoyee Boolean  @default(false)
  envoyeeAt  DateTime @default(now())

  createdAt DateTime @default(now())

  @@unique([contratId, delaiJours])
  @@map("alertes_cdd")
}


// ── ABSENCE ───────────────────────────────────────────────────────────────────
// Un seul enregistrement par employé par mois.
// jours : [{ date: "2026-01-15", estJustifie: true }, ...]
// Règle : absence justifiée → 0 déduction | absence injustifiée → 1 jour déduit
model Absence {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  mois  Int
  annee Int

  jours Json @default("[]") // JourAbsence[]

  // Rattaché au salaire lors de la clôture du mois
  salaireId String?  @unique
  salaire   Salaire? @relation(fields: [salaireId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, mois, annee])
  @@index([userId])
  @@index([mois, annee])
  @@map("absences")
}

// ── RETARD ────────────────────────────────────────────────────────────────────
// Un seul enregistrement par employé par mois.
// jours : [{ date: "2026-01-15", estJustifie: false }, ...]
// Règle : retard justifié → 0 déduction | retard injustifié → journée annulée (1 jour déduit)
// Contrainte : un même jour NE PEUT PAS figurer à la fois dans Absence et Retard.
model Retard {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  mois  Int
  annee Int

  jours Json @default("[]") // JourRetard[]

  salaireId String?  @unique
  salaire   Salaire? @relation(fields: [salaireId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, mois, annee])
  @@index([userId])
  @@index([mois, annee])
  @@map("retards")
}

// ── SALAIRE ───────────────────────────────────────────────────────────────────
// Initialisé manuellement par l'admin en début de mois.
// Clôturé en fin de mois → déclenche le calcul définitif.
// primes : [{ somme: 5000, raison: "Performance Q1" }, ...]
model Salaire {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])

  mois  Int
  annee Int   

  // ── Base de calcul ──
  nbJoursOuvrables Int             // jours lun–ven du mois
  prixJournalier   Decimal         @db.Decimal(12, 2) // salaireBrut / nbJoursOuvrables
  salaireBrut      Decimal         @db.Decimal(12, 2) // = user.salaireBase au moment de l'init

  // ── Absences (calculé à la clôture) ──
  nbAbsJust    Int     @default(0)
  nbAbsInjust  Int     @default(0)
  deductionAbs Decimal @default(0) @db.Decimal(12, 2) // nbAbsInjust × prixJournalier

  // ── Retards (calculé à la clôture) ──
  nbRetardsJust    Int     @default(0)
  nbRetardsInjust  Int     @default(0)
  deductionRetards Decimal @default(0) @db.Decimal(12, 2) // nbRetardsInjust × prixJournalier

  totalDeductions Decimal @default(0) @db.Decimal(12, 2)

  // ── Primes (modifiable avant clôture) ──
  primes      Json    @default("[]") // Prime[]
  totalPrimes Decimal @default(0)   @db.Decimal(12, 2)

  // ── Résultat ──
  salaireNet   Decimal  @db.Decimal(12, 2) // salaireBrut - totalDeductions + totalPrimes
  montantVerse Decimal? @db.Decimal(12, 2) // enregistré lors du versement réel
  ecart        Decimal? @db.Decimal(12, 2) // montantVerse - salaireNet

  estCloture  Boolean   @default(false)
  dateCloture DateTime?

  // Relations
  absence     Absence?
  retard      Retard?
  ficheDePaie FicheDePaie?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, mois, annee])
  @@index([userId])
  @@index([mois, annee])
  @@map("salaires")
}


model FicheDePaie {
  id        String  @id @default(cuid())
  salaireId String  @unique
  salaire   Salaire @relation(fields: [salaireId], references: [id])

  fichierPDF     String?
  dateGeneration DateTime  @default(now())
  signeeParUser  Boolean   @default(false)
  dateSignature  DateTime?
  jourDePaie     DateTime 

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("fiches_de_paie")
}


model Rapport {
  id     String  @id @default(cuid())
  userId String?
  user   User?   @relation(fields: [userId], references: [id])

  type         RapportType
  periode      String
  mois         Int?
  annee        Int?
  formatExport ExportFormat
  fichier      String?

  dateGeneration DateTime @default(now())
  createdAt      DateTime @default(now())

  // ─── AJOUT DU SOFT DELETE ───
  estArchive     Boolean  @default(false)
  deletedAt      DateTime?

  @@index([type])
  @@index([userId])
  @@map("rapports")
}


// ─── Commerce Log ─────────────────────────────────────────────────────────────


model CommerceLog {
  id String @id @default(cuid())

  // Who performed the action
  actorId   String
  actor     User   @relation(fields: [actorId], references: [id])
  actorName String

  // Which action on which module
  module CommerceModule
  action String
  level  LogLevel       @default(INFO)

  // Target entity
  entityId   String?
  entityName String?

  // Before / after diff
  valeurAvant String?
  valeurApres String?

  // Result
  state   State  @default(SUCCESS)
  message String

  createdAt DateTime @default(now())

  @@index([actorId])
  @@index([module])
  @@index([action])
  @@index([entityId])
  @@index([createdAt])
  @@index([level])

  @@map("commerce_logs")
}



// ─── RH Log model ─────────────────────────────────────────────────────────────

model RhLog {
  id String @id @default(cuid())

  // Who performed the action
  actorId   String
  actor     User   @relation(fields: [actorId], references: [id])
  actorName String

  // Which action on which module
  module RhModule
  action String
  level  LogLevel @default(INFO)

  // Target entity
  entityId   String?
  entityName String?

  // Before / after diff
  valeurAvant String?
  valeurApres String?

  // Result
  state   State  @default(SUCCESS)
  message String

  createdAt DateTime @default(now())

  @@index([actorId])
  @@index([module])
  @@index([action])
  @@index([entityId])
  @@index([createdAt])
  @@index([level])

  @@map("rh_logs")
}

// ─── Auth Log ─────────────────────────────────────────────────────────────────

enum AuthModule {
  AUTH
  USER
  ROLE
  PERMISSION
}

model AuthLog {
  id String @id @default(cuid())

  // Who performed the action
  actorId   String?       // nullable — some auth events have no identified user yet
  actor     User?         @relation(fields: [actorId], references: [id])
  actorName String?       // snapshot at time of action

  // Which action on which module
  module AuthModule
  action String
  level  LogLevel  @default(INFO)

  // Target entity
  entityId   String?
  entityName String?

  // Before / after diff
  valeurAvant String?
  valeurApres String?

  // Result + failure reason
  state   State   @default(SUCCESS)
  reason  Reason?
  message String

  // Extra auth context
  email String? // snapshot of the email involved (useful for failed logins)

  createdAt DateTime @default(now())

  @@index([actorId])
  @@index([module])
  @@index([action])
  @@index([email])
  @@index([createdAt])
  @@index([level])
  @@index([state])

  @@map("auth_logs")
}



// ─────────────────────────────────────────────
// --- EQNUMS OBLIGATOIRE ---
// ─────────────────────────────────────────────

enum CommerceModule {
  STOCK
  SALES_SESSION
  ENTREPRISE
}


enum RhModule {
  ABSENCE
  RETARD
  SALAIRE
  FICHE_PAIE
  CONTRAT
  DEPARTMENT
  RAPPORT
}


enum TypeSeuil {
  NORMAL    // quantite >= 20
  ALERTE    // 10 <= quantite < 20
  CRITIQUE  // quantite < 10
}

enum TypeMouvement {
  ENTREE
  SORTIE
  AJUSTEMENT
  PERTE
  INITIALISATION
}

enum LogLevel {
  INFO      
  WARNING   
  ERROR     
  CRITICAL  
}

enum State {
  SUCCESS
  FAILED
}

enum Reason {
  UNAUTHORIZED
  FORBIDDEN
  BAD_REQUEST
  CONFLICT
  UNKNOWN
  NOT_FOUND
  VALIDATION_ERROR
  SERVER_ERROR
  INTERNAL_SERVER_ERROR
}

enum AccountStatus {
  PENDING_VERIFICATION
  ACTIVE
  DEACTIVATED
  ARCHIVED
} 

enum HoraireEnum {
  JOUR
  NUIT
  MIXTE
}


enum ContratType {
  CDD
  CDI
}


enum AbsenceType {
  RETARD
  ABSENCE
}

enum Raison {
  MALADIE
  CONGE_PAYE
  CONGE_SANS_SOLDE
  INJUSTIFIE
  AUTRE
}

enum RapportType {
  ABSENCES
  RETARDS
  MASSE_SALARIALE
  CONTRATS_CDD
}

enum ExportFormat {
  PDF
  EXCEL
  CSV
}
```

---

## 5. Endpoints de l'API

> Rappel : préfixe global `/api/v1` omis dans les chemins ci-dessous pour lisibilité — à préfixer systématiquement.
> Sauf mention contraire, tous les contrôleurs listés ici portent `@UseGuards(AuthGuard, PermissionsGuard)`.

### 5.1 Auth — Authentification (`/auth`)

Voir la section détaillée [§3.5](#35-endpoints--apiv1auth).

### 5.2 Auth — Utilisateurs (`/users`)

Pas de route de création (la création se fait via `POST /auth/register`).

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `GET /users` | `user:read` | Liste paginée/filtrable (`estArchive?`, `roleId?`, `search?`, `page?=1`, `limit?=10`) |
| `GET /users/:id` | `user:read` | Détail d'un utilisateur |
| `GET /users/by-email/:email` | `user:read` | Recherche par email |
| `PATCH /users/:id` | `user:update` + `@RequireContratBoth()` | Met à jour un profil (`UpdateUserDto` — tout `CreateUserDto` sauf `email`/`password`) |
| `PATCH /users/archive/:id` | `user:archive` | Archive (soft delete) — révoque tous les tokens du compte |
| `PATCH /users/:id/restore` | `user:restore` | Restaure un compte archivé (ne restaure pas de session) |
| `GET /users/:id/logs` | `user:read_log` | Historique paginé des logs auth de cet utilisateur |

Réponse liste : `{ data: User[] (nettoyé), meta: { total, page, limit, lastPage, hasNextPage, hasPrevPage } }`.
`email` et `password` **ne sont jamais modifiables** via `PATCH /users/:id` (email figé, changement de mot de passe via le flux `reset-password`).

### 5.3 Auth — Rôles (`/roles`)

| Méthode & route | Permission | Description |
|---|---|---|
| `POST /roles` | `role:create` | Crée un rôle (`post`, `departmentId`, `permissionIds?[]`) |
| `GET /roles` | `role:read` | Liste paginée (`search?`, `departmentId?`, `page?=1`, `limit?=20`) |
| `GET /roles/:id` | `role:read` | Détail (avec département + permissions) |
| `PATCH /roles/:id` | `role:update` | Modifie `post`/`departmentId` (régénère `nomRole`) |
| `PUT /roles/:id/permissions/sync` | `role:update` | Remplace **toutes** les permissions (`{ permissionIds: number[] }`) |
| `POST /roles/:id/permissions/add` | `role:update` | Ajoute des permissions sans écraser |
| `POST /roles/:id/permissions/remove` | `role:update` | Retire des permissions spécifiques |
| `DELETE /roles/:id` | `role:delete` | Supprime (bloqué `409` si des utilisateurs ont ce rôle) |

⚠️ **Ne jamais envoyer `nomRole`** — généré automatiquement (`{post}_{department.name}`).

### 5.4 Auth — Permissions (`/permissions`)

| Méthode & route | Permission | Description |
|---|---|---|
| `POST /permissions` | `permission:create` | Crée une permission (`slug` format `ressource:action`, `description`) |
| `GET /permissions` | `permission:read` | Liste paginée (`search?`, `page?=1`, `limit?=50`) |
| `GET /permissions/:id` | `permission:read` | Détail (avec `_count.roles`) |
| `GET /permissions/slug/:slug` | `permission:read` | Recherche par slug |
| `PATCH /permissions/:id` | `permission:update` | Modifie slug/description |
| `DELETE /permissions/:id` | `permission:delete` | Supprime (détache d'abord des rôles) |

Contrainte de format : `slug` doit matcher `^[a-z_]+:[a-z_]+$` côté validation DTO (le service normalise ensuite en interne — voir §7).

### 5.5 Auth — Logs (`/auth-logs`)

⚠️ Contrôleur sans `PermissionsGuard` monté — voir §7. Seule l'authentification (`AuthGuard`) est requise en pratique.

| Méthode & route | Description |
|---|---|
| `GET /auth-logs` | Liste paginée, filtres `AuthLogFiltersDto` (`actorId?, module?, action?, level?, state?, reason?, email?, dateDebut?, dateFin?, page?=1, limit?=20`) |
| `GET /auth-logs/stats` | `{ total, parLevel[], parModule[], parState[] }` |
| `GET /auth-logs/actor/:actorId` | Logs d'un acteur |
| `GET /auth-logs/module/:module` | Logs par module (`AUTH \| USER \| ROLE \| PERMISSION`) |
| `GET /auth-logs/:id` | Détail complet (avec `valeurAvant`/`valeurApres`) |

### 5.6 Commerce — Articles (`/articles`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /articles/simple-create-article` | `article:create` + `RequireContratActor` | Crée un `Article` nu (`{ nomArticle }`) |
| `POST /articles/create` | `article:create` + `RequireContratActor` | Crée un article **avec** son premier format et stock initial |
| `GET /articles/find-all` | `article:read` | Liste paginée (`search?`, `status?: ACTIVE\|ARCHIVED\|ALL`, `page?=1`, `limit?=10`) |
| `GET /articles/:id/categories` | `article:read` | Liste paginée des formats d'un article |
| `GET /articles/find-one/:id` | `article:read` | Détail avec tous ses formats/stocks |
| `PATCH /articles/update/:id` | `article:update` + `RequireContratActor` | Renomme (bloqué si archivé) |
| `PATCH /articles/soft-delete/:id` | `article:update` + `RequireContratActor` | Archive l'article + ses formats/stocks |
| `PATCH /articles/restore/:id` | `article:update` + `RequireContratActor` | Restaure |
| `DELETE /articles/physical-delete/:id` | `article:delete` + `RequireContratActor` | Suppression définitive (si aucun mouvement réel) |

**`CreateArticleDto`** : `nom` (min 3), `description?` (min 5), `nomUniqueCategory` (requis), `prixUnite: number` (≥0), `seuilAlerte?` (≥1), `seuilCritique?` (≥0).

### 5.7 Commerce — Catégories (formats) (`/categories`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /categories/create` | `category:create` + `RequireContratActor` | Crée un format pour un article existant + stock initial |
| `GET /categories/find-all` | `category:read` | Liste paginée (`articleId?`, `search?`, `page?=1`, `limit?=10`) |
| `GET /categories/find-one/:id` | `category:read` | Détail (410 si archivé) |
| `PATCH /categories/update/:id` | `category:update` + `RequireContratActor` | Modifie nom/prix/description/seuils |
| `PATCH /categories/soft-delete/:id` | `category:update` + `RequireContratActor` | Archive le format + son stock |
| `PATCH /categories/restore-category/:id` | `category:update` + `RequireContratActor` | Restaure (bloqué si article parent archivé) |
| `DELETE /categories/delete/:id` | `category:delete` + `RequireContratActor` | Suppression définitive (si aucun mouvement réel) |

**`CreateCategoryDto`** : `nomUnique` (min 2), `prixUnite: number` (≥0, positif), `description?`, `articleId` (requis), `seuilAlerte?` (≥1), `seuilCritique?` (≥0).

### 5.8 Commerce — Mouvements de stock (`/movement-stock`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /movement-stock/mouvements` | `movement:create` + `RequireContratActor` | Enregistre un mouvement |
| `GET /movement-stock/get-stocks` | `movement:read` | Vue d'ensemble de tous les stocks actifs |
| `GET /movement-stock/Obtenir-Articles-En-Alerte` | `movement:read` | Stocks en alerte/critique uniquement |
| `GET /movement-stock/mouvements` | `movement:read` | Historique paginé (`articleStockId?`, `page?=1`, `limit?=50`) |

**`CreateMovementDto`** : `articleStockId: string`, `type: ENTREE\|SORTIE\|AJUSTEMENT\|PERTE\|INITIALISATION`, `quantite: number` (entier positif), `motif?: string`, `movementDate: Date` (**requis**, pas de défaut).

⚠️ `GET /movement-stock/get-stocks` retourne un champ `niveauAlerte` avec les valeurs `'NORMAL'|'LOW'|'CRITICAL'`, différent de l'enum Prisma réel `NORMAL|ALERTE|CRITIQUE` utilisé partout ailleurs (y compris sur l'endpoint "alertes") — voir §7.

### 5.9 Commerce — Sessions de vente (`/sales-sessions`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /sales-sessions/open-session` | `salessession:create` + `RequireContratBoth` | Ouvre une session (manager confie du stock à un commercial) |
| `PATCH /sales-sessions/:id/close-session` | `salessession:update` + `RequireContratActor` | Clôture (retour + dépenses) |
| `PATCH /sales-sessions/:id/cancel` | `salessession:update` + `RequireContratActor` | Annule, réintègre le stock |
| `GET /sales-sessions` | `salessession:read` | Liste paginée (`status?`, `jourOuverture?`, `page?=1`, `limit?=20`) |
| `GET /sales-sessions/:id` | `salessession:read` | Détail |
| `GET /sales-sessions/commercial/:commercialId` | `salessession:read` | Historique d'un commercial |

**`OpenSessionDto`** : `commercialId`, `articleStockId` (requis), `quantiteDepart: number` (entier positif), `jourOuverture?` (défaut aujourd'hui), `heureDepart?` (`HH:mm`, défaut maintenant).
**`CloseSessionDto`** : `quantiteRetour: number` (≥0), `depenses?: { montant: number (≥0), motif: string }[]`, `heureRetour?` (`HH:mm`).

⚠️ La route `cancel` lit `managerId` via **query string** (`?managerId=...`), pas via le JWT connecté — à ne pas oublier côté frontend.

### 5.10 Commerce — Entreprise (`/entreprise`)

Configuration **singleton** (une seule entreprise en base).

| Méthode & route | Permission | Description |
|---|---|---|
| `POST /entreprise` | `entreprise:create` | Crée l'entreprise (409 si déjà configurée) |
| `GET /entreprise` | `entreprise:read` | Récupère les infos (404 si non configurée) |
| `PATCH /entreprise` | `entreprise:update` | Met à jour (partiel) |
| `POST /entreprise/logo` | `entreprise:update` | Upload logo (`multipart/form-data`, champ `logo`, JPEG/PNG uniquement, 2 Mo max) |

**`CreateEntrepriseDto`** : `nom` (min 2, requis), `adresse?`, `telephone?`, `email?` (format email).

### 5.11 Commerce — Logs (`/commerce-logs`)

⚠️ Contrôleur sans `PermissionsGuard` monté — voir §7.

| Méthode & route | Description |
|---|---|
| `GET /commerce-logs` | Liste paginée, filtres (`actorId?, module?: STOCK\|SALES_SESSION\|ENTREPRISE, action?, level?, state?, entityId?, dateDebut?, dateFin?, page?=1, limit?=20`) |
| `GET /commerce-logs/stats` | Statistiques agrégées |
| `GET /commerce-logs/actor/:actorId` | Logs d'un acteur |
| `GET /commerce-logs/:id` | Détail complet |

### 5.12 RH — Absences (`/absences`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /absences/jours` | `absence:create` + `RequireContratBoth` | Ajoute des jours d'absence pour un mois |
| `PATCH /absences/jour` | `absence:update` + `RequireContratBoth` | Change la justification d'un jour |
| `DELETE /absences/jour` | `absence:delete` + `RequireContratBoth` | Supprime un jour |
| `GET /absences` | `absence:read` | Liste paginée (`userId?, mois?, annee?, page?=1, limit?=10`) |
| `GET /absences/:userId/:mois/:annee` | `absence:read` | Détail d'un enregistrement mensuel |

**`AjouterAbsenceDto`** : `userId`, `mois` (1–12), `annee` (≥2000), `jours: { date: string (ISO), estJustifie: boolean }[]` (min 1 élément).

### 5.13 RH — Retards (`/retards`)

Structure identique au module Absences.

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /retards/jours` | `retard:create` + `RequireContratBoth` | Ajoute des jours de retard |
| `PATCH /retards/jour` | `retard:update` + `RequireContratBoth` | Met à jour un jour (justification + `heureArrivee?`) |
| `DELETE /retards/jour` | `retard:delete` + `RequireContratBoth` | Supprime un jour |
| `GET /retards` | `retard:read` | Liste paginée |
| `GET /retards/:userId/:mois/:annee` | `retard:read` | Détail mensuel |

`JourRetardDto` ajoute un champ optionnel `heureArrivee?: string` (format `HH:MM`).

### 5.14 RH — Salaires & paie (`/salaires`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /salaires/initialiser` | `salaire:create` + `RequireContratBoth` | Initialise le salaire du mois (`{ userId, mois, annee }`) |
| `GET /salaires/masse-salariale` | `salaire:read` | Agrégats globaux d'un mois (salaires **clôturés** uniquement) |
| `GET /salaires` | `salaire:read` | Liste paginée (`userId?, mois?, annee?, estCloture?, page?=1, limit?=10`) |
| `PATCH /salaires/:id/primes` | `salaire:update` + `RequireContratActor` | Ajoute une prime (`{ somme: number (>0), raison: string (min 3) }`) |
| `DELETE /salaires/:id/primes` | `salaire:update` + `RequireContratActor` | Supprime une prime par index (`{ index: number }`) |
| `POST /salaires/:id/cloturer` | `salaire:update` + `RequireContratActor` | Clôture définitive du mois (calcul final) |
| `POST /salaires/:id/versements` | `salaire:update` + `RequireContratActor` | Enregistre le versement (`{ montantVerse: number (>0) }`) |
| `POST /salaires/:id/fiche-de-paie` | `salaire:update` + `RequireContratActor` | Génère le PDF fiche de paie (`{ jourDePaie: string (ISO, pas futur) }`) |
| `GET /salaires/:id/telecharger-fiche` | `salaire:update` | Télécharge le PDF (flux binaire) |
| `GET /salaires/:id` | `salaire:read` | Détail complet |
| `GET /salaires/user/:userId/historique-paiements` | `salaire:read` + `RequireContratBoth` | Historique paginé/filtrable des salaires versés d'un employé |

Voir §6 pour les règles de calcul détaillées (déductions, primes, clôture, versement).

### 5.15 RH — Contrats (`/contrats`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /contrats` | `contrat:create` | Crée un contrat (`{ userId, type: CDD\|CDI, dateDebut, dateFin? }`) |
| `GET /contrats` | `contrat:read` | Liste (`userId?`, `type?`) — pagination par défaut côté service |
| `GET /contrats/expirations` | `contrat:read` | CDD arrivant à expiration (`delai?: number` jours, défaut 30) |
| `GET /contrats/:id` | `contrat:read` | Détail |
| `PUT /contrats/:id` | `contrat:update` + `RequireContratActor` | Modifie **uniquement `dateFin`** (CDD seulement) |
| `DELETE /contrats/:id` | `contrat:delete` + `RequireContratActor` | Archive (soft delete) |
| `PATCH /contrats/:id/restore` | `contrat:restore` + `RequireContratActor` | Restaure |

`dateFin` **requis** si `type=CDD`, **interdit** si `type=CDI`.

### 5.16 RH — Départements (`/departments`)

| Méthode & route | Permission | Description |
|---|---|---|
| `POST /departments` | `department:create` | Crée (`{ name: string (min 2) }`, normalisé en MAJUSCULES) |
| `GET /departments` | `department:read` | Liste paginée (`search?`, `page?=1`, `limit?=20`) |
| `GET /departments/:id` | `department:read` | Détail (avec rôles + permissions) |
| `PATCH /departments/:id` | `department:update` | Modifie le nom |
| `DELETE /departments/:id` | `department:delete` | Suppression définitive (409 si des rôles y sont rattachés) |

### 5.17 RH — Rapports (`/rapports`)

| Méthode & route | Permission / garde | Description |
|---|---|---|
| `POST /rapports/generer` | `rapport:create` + `RequireContratActor` | Génère un rapport PDF/Excel |
| `GET /rapports/:id/telecharger` | `rapport:read` | Télécharge le fichier |
| `GET /rapports` | `rapport:read` | Liste paginée (`type?, userId?, mois?, annee?, includeArchived?=false, page?=1, limit?=50`) |
| `GET /rapports/:id` | `rapport:read` | Détail |
| `DELETE /rapports/:id/supprimer` | `rapport:delete` + `RequireContratActor` | Archive (soft delete, supprime le fichier disque) |
| `PATCH /rapports/:id/restore` | `rapport:update` + `RequireContratActor` | Réactive (le fichier n'est **pas** régénéré automatiquement) |

**`CreateRapportDto`** : `type: ABSENCES|MASSE_SALARIALE|CONTRATS_CDD` (⚠️ `RETARDS` existe dans l'enum mais n'est pas implémenté côté service), `mois?`, `annee?`, `userId?`, `formatExport: PDF|EXCEL` (⚠️ `CSV` explicitement rejeté par le service malgré sa présence dans l'enum).

### 5.18 RH — Logs (`/rh-logs`)

⚠️ Contrôleur sans `PermissionsGuard` monté — voir §7.

| Méthode & route | Description |
|---|---|
| `GET /rh-logs` | Liste paginée, filtres (`actorId?, module?: ABSENCE\|RETARD\|SALAIRE\|FICHE_PAIE\|CONTRAT\|DEPARTMENT\|RAPPORT, action?, level?, state?, entityId?, dateDebut?, dateFin?, page?=1, limit?=20`) |
| `GET /rh-logs/stats` | Statistiques agrégées |
| `GET /rh-logs/actor/:actorId` | Logs d'un acteur |
| `GET /rh-logs/:id` | Détail complet |

### 5.19 Admin — Health (`/health`)

Toutes les routes sont `@Public()` (pas d'authentification) — pratique pour un load balancer/monitoring, mais consultables sans cookie.

| Méthode & route | Description |
|---|---|
| `GET /health` | Check complet (DB, disque, heap, RSS) via `@nestjs/terminus` |
| `GET /health/db` | Vérifie uniquement la base de données |
| `GET /health/memory` | Vérifie uniquement la mémoire |
| `GET /health/live` | Liveness probe simple (`{ status: 'ok', timestamp, uptime, environment }`) |
| `GET /health/ready` | Readiness probe (vérifie la DB) |

Réponse au format standard Terminus (`{ status, info, error, details }`), potentiellement **non enveloppée** de la même manière que le reste de l'API — à vérifier en pratique côté front.

---

## 6. Règles métier & contraintes importantes

### Authentification & sécurité
- Pas d'auto-inscription : seul un admin authentifié avec la permission `authentification:create` peut créer un compte (`POST /auth/register`).
- Login refusé (`401`) tant que l'email n'est pas vérifié, ou si le compte est désactivé/archivé.
- Tokens hashés (bcrypt) et stockés en base → révocation immédiate possible (logout, désactivation, rotation). Toute requête protégée fait un aller-retour DB.
- Rotation stricte du refresh : un mismatch entre le token présenté et le hash stocké **invalide immédiatement** les deux tokens (protection anti-vol de session).
- Bypass total des permissions pour tout rôle possédant le slug `Manage_system` (super admin).
- Format de slug de permission : `ressource:action` en minuscules (ex: `salaire:update`).

### Contrats & éligibilité aux actions
- `ContratGuard` (global mais opt-in par décorateur) bloque de nombreuses actions RH/Commerce si l'employé cible et/ou l'acteur n'a pas de contrat actif (`CDI`, ou `CDD` avec `dateFin` non expirée).
- Alertes CDD automatiques : cron quotidien (2h du matin) qui envoie des alertes à J-30, J-15 et J-7 avant l'expiration d'un CDD (une seule alerte par palier, contrainte unique `(contratId, delaiJours)`).
- Modification d'un contrat limitée à `dateFin` (CDD uniquement) ; un CDI n'a jamais de `dateFin`.

### Absences / Retards / Paie (le cœur métier RH)
- **Un enregistrement mensuel unique** par employé pour `Absence`, `Retard` et `Salaire` (contrainte `(userId, mois, annee)`), avec un tableau JSON de `jours` fusionné à chaque ajout.
- **Un même jour ne peut pas être à la fois absence et retard** pour le même employé (contrôle croisé, `409 Conflict` sinon).
- **Modification bloquée si le salaire du mois est déjà clôturé** (ou pas encore initialisé) — un salaire doit être initialisé avant de pouvoir enregistrer des absences/retards du mois correspondant.
- **Calcul du salaire net** :
  - `nbJoursOuvrables` = nombre total de jours calendaires du mois (tous les jours, pas seulement lundi-vendredi, malgré le nom).
  - `prixJournalier = salaireBrut / nbJoursOuvrables`.
  - Seules les absences **injustifiées** sont déduites (1 jour = 1 `prixJournalier`) ; une absence justifiée = 0 déduction.
  - Un retard **injustifié annule toute la journée** (déduit comme une absence complète) ; un retard justifié = 0 déduction.
  - `salaireNet = max(0, salaireBrut - totalDeductions + totalPrimes)` — jamais négatif.
- **Cycle de vie d'un salaire** : `initialiser` → (ajout/suppression de primes librement) → `cloturer` (calcul définitif et irréversible, rattache les enregistrements Absence/Retard du mois) → `versement` (montant versé doit être **exactement égal** au `salaireNet`, un seul versement possible) → `fiche-de-paie` (PDF, une seule par salaire, date non future).
- La masse salariale (`GET /salaires/masse-salariale`) n'agrège que les salaires **clôturés**.

### Stock & Commerce
- Chaque `ArticleStock` (couple article × format/catégorie) a ses propres seuils `seuilAlerte` (défaut 20) et `seuilCritique` (défaut 10) : `qté ≤ seuilCritique → CRITIQUE`, `qté ≤ seuilAlerte → ALERTE`, sinon `NORMAL`.
- Mouvements : `ENTREE`/`AJUSTEMENT` peuvent augmenter, `SORTIE`/`PERTE` sont bloqués si le stock est insuffisant. Concurrence optimiste (`409 Conflict` si le stock a été modifié entre-temps par un autre utilisateur).
- Sessions de vente terrain : ouverture décrémente le stock central (le commercial "emporte" du stock), clôture calcule `quantiteVendue = quantiteDepart - quantiteRetour`, réintègre le solde non vendu, calcule un chiffre d'affaires théorique (`quantiteVendue × prixUnite`).
- Une seule session `OPEN` à la fois par commercial.
- Une seule `Entreprise` en base (singleton) — `POST` refusé si déjà configurée.

### Suppression / archivage
- Pattern "soft delete réversible" (`deletedAt`/`estArchive` + route `restore`) sur : `Article`, `Category`, `ArticleStock`, `Contrat`, `Rapport`, `User` (`estArchive`).
- `Department` et `Permission` sont en **hard delete uniquement** (bloqué si dépendances existantes).
- Hard delete d'`Article`/`Category`/`Role` toujours bloqué si l'entité a un historique réel (mouvements de stock non-système, utilisateurs assignés).
- Archiver un utilisateur (`PATCH /users/archive/:id`) révoque immédiatement tous ses tokens (déconnexion forcée) ; le restaurer ne rétablit pas de session (reconnexion manuelle nécessaire).

---

## 7. Anomalies connues / points d'attention pour le frontend

Ces points ont été repérés en lisant le code serveur — ils ne sont pas des choix d'architecture documentés mais des comportements réels à connaître pour éviter des surprises côté UI, ou des points à faire corriger côté backend si nécessaire :

1. **Contrôleurs de logs sans vérification de permission réelle** : `commerce-logs`, `auth-logs` et `rh-logs` ne montent pas `PermissionsGuard` sur leur classe. Les décorateurs `@RequirePermissions('*-log:read')` posés sur leurs routes sont donc des métadonnées **sans effet** à l'exécution — seul `AuthGuard` (être connecté) protège ces routes. **Tout utilisateur authentifié, quel que soit son rôle, peut aujourd'hui consulter ces journaux d'audit.** Ne pas se reposer uniquement sur le serveur pour restreindre l'accès à ces écrans côté UI tant que ce n'est pas corrigé côté backend.
2. **Incohérence de nommage des niveaux d'alerte stock** : `GET /movement-stock/get-stocks` renvoie `niveauAlerte` avec les valeurs `'NORMAL' | 'LOW' | 'CRITICAL'`, alors que partout ailleurs (y compris `GET /movement-stock/Obtenir-Articles-En-Alerte` et l'enum Prisma `TypeSeuil`) ce sont `'NORMAL' | 'ALERTE' | 'CRITIQUE'`. Le frontend doit gérer les deux nomenclatures selon l'endpoint appelé.
3. **`ecartCaisse` toujours égal à 0 en pratique** : la clôture d'une session de vente calcule `totalVentesRecues` automatiquement comme `quantiteVendue × prixUnite` (identique à `chiffreAffaireTheorique`) — il n'existe pas aujourd'hui de champ dans `CloseSessionDto` pour saisir le montant réellement remis en espèces par le commercial. L'écart de caisse ne peut donc jamais être différent de 0 avec le code actuel. À clarifier avec l'équipe backend avant de concevoir un écran de rapprochement de caisse.
4. **`PATCH /sales-sessions/:id/cancel` lit `managerId` via query string**, pas depuis le JWT connecté (contrairement à toutes les autres routes du même contrôleur qui utilisent l'utilisateur courant) — il faut explicitement passer `?managerId=<id>`.
5. **`@Roles()` / `RolesGuard` sont du code mort** : le décorateur et le guard existent dans `src/modules/auth/authentification/{decorators,guards}` mais `RolesGuard` n'est monté nulle part (ni globalement, ni sur un contrôleur). Le contrôle d'accès réel passe exclusivement par `@RequirePermissions` + `PermissionsGuard`. Ne pas construire de logique frontend basée sur l'enum `Role` de Prisma pour les autorisations (il n'existe d'ailleurs pas d'enum `Role` figé — `nomRole` est une chaîne générée dynamiquement).
6. **La stratégie Passport `JwtStrategy` (`'jwt'`, lecture via header `Authorization: Bearer`) n'est jamais utilisée par un guard actif** — la protection réelle des routes passe par le guard custom `AuthGuard` qui lit exclusivement le cookie `access_token`. Ne pas essayer d'envoyer un header `Authorization: Bearer <token>` côté frontend, cela n'aura aucun effet ; seuls les cookies comptent.
7. **`RapportType.RETARDS` et `ExportFormat.CSV` existent dans les enums Prisma mais sont explicitement non supportés** par le service de génération de rapports (retourne une erreur/`[]`). Ne pas les proposer dans l'UI de génération de rapports pour l'instant.
8. **Protection CSRF désactivée** : la dépendance `csrf-csrf` est présente et un middleware de debug loggue à la console la présence des cookies/headers CSRF sur chaque requête, mais la vérification (`doubleCsrfProtection`) est commentée dans `main.ts`. Aucune protection CSRF active actuellement (mitigée en partie par `sameSite: 'strict'` sur les cookies).
9. **`GET /contrats` n'applique pas la pagination du DTO `GetContratsFilterDto`** dans le contrôleur actuel — seuls `userId` et `type` sont lus depuis la query string ; la pagination affichée dans `meta` vient de valeurs par défaut côté service.
10. **`UpdateArticleDto.unite`** est accepté par la validation mais n'est pas réellement appliqué par le service `update()` (seul `nom` est pris en compte) — champ à ne pas utiliser tant que ce n'est pas branché côté backend.
11. **Configuration Helmet fortement allégée** (CSP, HSTS, COOP, CORP, etc. désactivés) — à ne pas considérer comme une référence de sécurité pour la prod ; c'est une configuration de développement.
12. **`FRONTEND_URL`** doit être configurée dans `backend/.env` (actuellement `http://localhost:5173`) pour que CORS + les liens dans les emails (vérification, reset password) pointent vers le bon frontend — à garder synchronisé avec le port réel du dev server React/Vite.
