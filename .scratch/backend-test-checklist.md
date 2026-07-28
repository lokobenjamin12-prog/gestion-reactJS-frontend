# Checklist de tests manuels ciblés — Backend Ndolecam

Objectif : révéler les points faibles réels du backend en testant les cas limites, pas le chemin heureux (que tu as déjà validé en construisant chaque écran). Utilise Bruno ou Swagger (`/api/v1/docs`). Pour chaque item : exécute, note si le comportement obtenu correspond à "Attendu" — sinon c'est un bug à corriger.

Coche au fur et à mesure. Priorise les sections 1 à 3 (les plus critiques) avant le reste.

---

## 1. Authentification — cas limites

- [ ] Login avec mauvais mot de passe 5x de suite → toujours 401 générique "Identifiants invalides" (pas de fuite d'info du style "email trouvé mais mdp faux")   ✅

- [ ] Login avec un compte `PENDING_VERIFICATION` (jamais vérifié par email) → doit être refusé, pas connecté  ✅

- [ ] Login avec un compte `DEACTIVATED`/archivé → doit être refusé  ✅

- [ ] Appeler une route protégée (`GET /users`) **sans aucun cookie** → 401, pas un crash 500✅


- [ ] Appeler une route protégée avec un `access_token` **expiré** mais un `refresh_token` valide → le frontend doit auto-refresh et rejouer la requête (regarde le Network tab : tu dois voir `POST /auth/refresh` suivi d'un retry automatique, pas une déconnexion) ✅


- [ ] Appeler `POST /auth/refresh` avec un `refresh_token` **invalide/altéré** → doit invalider les deux tokens en base et renvoyer 401 (vérifie en base que `accessToken`/`refreshToken` de l'utilisateur passent bien à `null`) ✅


- [ ] `POST /auth/change-password` avec `currentPassword` incorrect → 400, et vérifie que l'ancien mot de passe fonctionne toujours pour se reconnecter (pas de corruption) ✅


- [ ] `POST /auth/change-password` avec `newPassword` identique à l'actuel → doit être rejeté (400) ✅

- [ ] Après un changement de mot de passe réussi, réessaie d'utiliser l'ancien `access_token` déjà en cache côté client → doit être refusé (la session doit être vraiment révoquée, pas juste côté cookie frontend) ✅


- [ ] `POST /auth/forgot-password` avec un email **inexistant** → doit renvoyer le même message générique qu'un email existant (pas de fuite d'info), et ne doit rien planter  ✅


- [ ] Utiliser un lien de reset password **deux fois** (le même token) → le 2e essai doit échouer (token à usage unique) ✅


- [ ] Utiliser un lien de reset password **expiré** (attends l'expiration ou modifie `resetPasswordExpires` en base pour tester plus vite) → 400 explicite, pas 500  ✅


## 2. Permissions & RBAC — accès croisés

- [ ] Crée un utilisateur de test avec un rôle **sans** la permission `user:read` → `GET /users` doit renvoyer 403, pas une liste vide silencieuse ✅

- [ ] Avec ce même utilisateur restreint, essaie d'accéder à `GET /users/:id` sur **un autre** utilisateur que lui-même → vérifie si c'est vraiment bloqué (le commentaire Swagger dit "les users voient leur propre profil" — confirme que c'est réellement appliqué dans le code, pas juste documenté)✅

- [ ] Retire la permission `salessession:update` à un manager de test → `PATCH /sales-sessions/:id/close-session` doit 403, pas planter✅

- [ ] Teste qu'un utilisateur avec **`Manage_system`** peut tout faire même sans les permissions détaillées (bypass admin) — confirme que ça marche vraiment sur au moins 3 endpoints différents de modules différents ✅

- [ ] Essaie d'appeler `PATCH /users/:id` en modifiant le `roleId` vers un rôle qui **n'existe pas** (ex: `999999`) → 404 propre, pas de crash Prisma ✅

- [ ] Un utilisateur peut-il s'auto-archiver via `PATCH /users/archive/:id` avec son propre ID ? Si oui, est-ce voulu ? (risque : un admin unique qui s'auto-archive et se retrouve bloqué dehors)

## 3. Sessions commerciales — concurrence & calculs (zone déjà fragile)

- [ ] Ouvre une session pour un commercial qui a **déjà** une session `OPEN` → doit être bloqué (409/400), pas créer une 2e session en double ✅

- [ ] Ouvre une session avec une `quantiteDepart` **supérieure** au stock disponible → doit être bloqué, le stock central ne doit **pas** passer en négatif✅

- [ ] **Concurrence réelle** : envoie 2 requêtes `POST /sales-sessions/open-session` quasi simultanément pour le même `articleStockId` avec une quantité proche du stock restant (ex: stock = 10, deux requêtes de 8 chacune) → une seule doit réussir, l'autre doit échouer proprement. C'est le test le plus important : les transactions Prisma protègent-elles vraiment contre une race condition ici, ou les deux passent-elles et le stock devient négatif ?  


- [ ] Clôture une session avec `quantiteRetour` **négative** → doit être rejeté par la validation (`@Min(0)`), pas accepté silencieusement ✅


- [ ] Clôture une session déjà `CLOSED` → 400 explicite, pas de double traitement (double réintégration de stock) ✅

- [ ] Annule une session déjà `CLOSED` → doit être refusé (`cancelSession` ne doit accepter que `OPEN`) ✅

- [ ] Annule une session **deux fois de suite** rapidement (2 requêtes simultanées) → vérifie que le stock n'est pas réintégré deux fois ✅

- [ ] Ferme une session avec une liste de `depenses` où **une ligne a un montant négatif** → doit être rejeté ou au moins ne pas fausser `totalDepenses`  ✅

- [ ] Vérifie à nouveau que `heureRetour` avec une valeur `"25:99"` (heure invalide mais qui pourrait passer une regex mal écrite) est bien rejetée par `@Matches` ✅

## 4. Stock & Mouvements — cohérence des quantités

- [ ] Crée un mouvement `SORTIE` avec une `quantite` supérieure au stock actuel → doit être bloqué, pas de stock négatif ✅

- [ ] Crée un mouvement `AJUSTEMENT` avec une quantité négative → vérifie le comportement (c'est censé être une quantité absolue, pas un négatif)

- [ ] Archive un article qui a encore des `ArticleStock` avec `quantiteActuelle > 0` → est-ce autorisé ? Si oui, ce stock devient-il orphelin/invisible mais toujours en base ?


- [ ] Crée un format (`Category`) avec un `articleId` qui n'existe pas → 404 propre

- [ ] Crée un format avec un `nomUnique` qui existe déjà pour ce même article (doublon) → doit être bloqué (409), pas de doublon silencieux

- [ ] Restaure un format archivé dont l'article parent est **lui-même archivé** → comportement cohérent ? (ne devrait probablement pas être permis)

## 5. Upload de fichiers — robustesse

- [ ] Upload un fichier `.exe` renommé en `.png` (mauvais mimetype réel) → le `fileFilter` doit le bloquer (il vérifie `file.mimetype`, qui vient de l'en-tête déclaré par le client — teste si c'est vraiment fiable ou contournable)

- [ ] Upload un fichier de **plus de 2 Mo** → doit être rejeté avec un message clair, pas un crash serveur

- [ ] Upload une photo de profil pour un `id` d'utilisateur **inexistant** → 404 propre (et vérifie qu'aucun fichier orphelin ne reste sur le disque après l'échec)

- [ ] Upload 2 photos de profil coup sur coup pour le même utilisateur → vérifie que l'**ancien** fichier est bien supprimé du disque (pas d'accumulation de fichiers orphelins dans `uploads/profile-pictures/`)

- [ ] Essaie d'accéder directement à un fichier via son URL statique en devinant/énumérant un nom de fichier proche d'un fichier existant → confirme qu'il n'y a pas de listing de répertoire activé (`app.useStaticAssets` ne doit pas exposer l'arborescence)

## 6. Validation des entrées — cas génériques (à tester sur 3-4 endpoints de création différents, pas tous)

- [ ] Envoie un body **vide `{}`** sur un endpoint de création (ex: `POST /articles`, `POST /departments`) → doit lister proprement les champs manquants, pas 500
- [ ] Envoie un champ **du mauvais type** (ex: `quantiteDepart: "abc"` au lieu d'un nombre) → doit être rejeté par la validation, pas planter en aval dans un calcul
- [ ] Envoie des champs **non déclarés dans le DTO** (ex: `{ "hackedField": true, ...reste normal }`) → grâce à `forbidNonWhitelisted: true`, doit être rejeté (confirme que ça fonctionne vraiment sur un endpoint)
- [ ] Envoie une chaîne **très longue** (10 000 caractères) dans un champ texte libre (ex: `motif`, `description`) → ne doit pas crasher la base (vérifie s'il y a une limite `@MaxLength` ou si Prisma/Postgres gère nativement)
- [ ] Teste une tentative d'injection basique dans un champ de recherche texte (`search=' OR '1'='1`) sur `GET /users?search=...` → Prisma paramètre les requêtes nativement donc ça devrait être sûr, mais vérifie qu'il n'y a pas de requête SQL brute (`$queryRawUnsafe`) construite avec ce paramètre quelque part

## 7. Non-régression — bugs déjà corrigés à revérifier

Ces bugs ont été trouvés et corrigés pendant les sessions précédentes — confirme qu'ils restent corrigés (utile après tout futur refactor) :

- [ ] `PATCH /sales-sessions/:id/close-session` avec un `heureRetour` renseigné (ex: `"14:30"`) → ne doit plus crasher (`Invalid time value`)
- [ ] `POST /categories` → ne doit plus renvoyer `Unknown argument seuilAlerte` (vérifie que `tx.category.create()` ne reçoit que les champs propres à `Category`)
- [ ] `GET /commerce-logs` renvoie bien le journal d'audit, et `GET /sales-sessions` renvoie bien les sessions de vente (plus de collision de route)
- [ ] Une photo de profil uploadée renvoie un `profilePicture` **relatif** (ex: `profile-pictures/xxx.png`), jamais un chemin absolu Windows/Linux
- [ ] Rafraîchir une page profonde du frontend (ex: `/sessions/abc123`) ne redirige plus vers `/dashboard` (bug de la race condition `AuthBootstrap`)

---

## Comment procéder

1. Coche les cases au fur et à mesure — note à côté de chaque échec le message d'erreur exact reçu (ou l'absence d'erreur si le système accepte silencieusement quelque chose qu'il ne devrait pas).
2. Priorise la **section 3** (Sessions commerciales, concurrence) — c'est là qu'on a le plus de logique métier avec transactions, donc le plus grand risque de race conditions.
3. Reviens vers moi avec les résultats (colle-moi les réponses JSON des cas qui échouent) — je diagnostique et corrige comme on l'a fait jusqu'ici, un bug à la fois.
