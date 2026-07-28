import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { PublicOnlyRoute } from './guards/PublicOnlyRoute';
import { RequirePermission } from './guards/RequirePermission';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { AccountPage } from '@/features/auth/pages/AccountPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { UserDetailPage } from '@/features/users/pages/UserDetailPage';
import { CreateUserPage } from '@/features/users/pages/CreateUserPage';
import { EditUserPage } from '@/features/users/pages/EditUserPage';
import { RolesListPage } from '@/features/roles/pages/RolesListPage';
import { RoleDetailPage } from '@/features/roles/pages/RoleDetailPage';
import { CreateRolePage } from '@/features/roles/pages/CreateRolePage';
import { EditRolePage } from '@/features/roles/pages/EditRolePage';
import { ContratsListPage } from '@/features/contrats/pages/ContratsListPage';
import { ContratDetailPage } from '@/features/contrats/pages/ContratDetailPage';
import { CreateContratPage } from '@/features/contrats/pages/CreateContratPage';
import { EditContratPage } from '@/features/contrats/pages/EditContratPage';
import { ContratExpirationsPage } from '@/features/contrats/pages/ContratExpirationsPage';
import { AbsencesListPage } from '@/features/absences/pages/AbsencesListPage';
import { AbsenceDetailPage } from '@/features/absences/pages/AbsenceDetailPage';
import { CreateAbsencePage } from '@/features/absences/pages/CreateAbsencePage';
import { RetardsListPage } from '@/features/retards/pages/RetardsListPage';
import { RetardDetailPage } from '@/features/retards/pages/RetardDetailPage';
import { CreateRetardPage } from '@/features/retards/pages/CreateRetardPage';
import { SalairesListPage } from '@/features/salaires/pages/SalairesListPage';
import { SalaireDetailPage } from '@/features/salaires/pages/SalaireDetailPage';
import { InitialiserSalairePage } from '@/features/salaires/pages/InitialiserSalairePage';
import { MasseSalarialePage } from '@/features/salaires/pages/MasseSalarialePage';
import { HistoriquePaiementsPage } from '@/features/salaires/pages/HistoriquePaiementsPage';
import { DepartmentsListPage } from '@/features/departments/pages/DepartmentsListPage';
import { DepartmentDetailPage } from '@/features/departments/pages/DepartmentDetailPage';
import { CreateDepartmentPage } from '@/features/departments/pages/CreateDepartmentPage';
import { EditDepartmentPage } from '@/features/departments/pages/EditDepartmentPage';
import { CreateRapportPage } from '@/features/rapports/pages/CreateRapportPage';
import { RapportsListPage } from '@/features/rapports/pages/RapportsListPage';
import { RapportDetailPage } from '@/features/rapports/pages/RapportDetailPage';
import { ArticlesListPage } from '@/features/articles/pages/ArticlesListPage';
import { ArticleDetailPage } from '@/features/articles/pages/ArticleDetailPage';
import { CreateArticlePage } from '@/features/articles/pages/CreateArticlePage';
import { EditArticlePage } from '@/features/articles/pages/EditArticlePage';
import { CategoriesListPage } from '@/features/categories/pages/CategoriesListPage';
import { CategoryDetailPage } from '@/features/categories/pages/CategoryDetailPage';
import { CreateCategoryPage } from '@/features/categories/pages/CreateCategoryPage';
import { EditCategoryPage } from '@/features/categories/pages/EditCategoryPage';
import { StockOverviewPage } from '@/features/movements/pages/StockOverviewPage';
import { StockAlertsPage } from '@/features/movements/pages/StockAlertsPage';
import { MouvementsHistoryPage } from '@/features/movements/pages/MouvementsHistoryPage';
import { CreateMovementPage } from '@/features/movements/pages/CreateMovementPage';
import { SessionsListPage } from '@/features/sessions/pages/SessionsListPage';
import { SessionDetailPage } from '@/features/sessions/pages/SessionDetailPage';
import { CreateSessionPage } from '@/features/sessions/pages/CreateSessionPage';
import { LogsOverviewPage } from '@/features/logs/pages/LogsOverviewPage';
import { LogSubModulePage } from '@/features/logs/pages/LogSubModulePage';
import { NotFoundPage } from '@/shared/pages/NotFoundPage';
import { ForbiddenPage } from '@/shared/pages/ForbiddenPage';

function RootRedirect() {
  const status = useAuthStore((s) => s.status);
  return <Navigate to={status === 'authenticated' ? '/dashboard' : '/auth/login'} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  { path: '/auth/verify-email', element: <VerifyEmailPage /> },
  { path: '/auth/reset-password', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/account', element: <AccountPage /> },
          // Pas de RequirePermission ici : l'accès dépend de laquelle des 3
          // permissions (auth/commerce/rh-log:read) l'utilisateur possède,
          // la page filtre donc elle-même les catégories visibles.
          { path: '/logs', element: <LogsOverviewPage /> },
          // Permission vérifiée dans la page elle-même (dépend du :key, donc
          // de la catégorie commerce/auth/rh résolue dynamiquement).
          { path: '/logs/:key', element: <LogSubModulePage /> },
          {
            element: <RequirePermission slug="user:read" />,
            children: [
              { path: '/users', element: <UsersListPage /> },
              { path: '/users/:id', element: <UserDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="authentification:create" />,
            children: [{ path: '/users/new', element: <CreateUserPage /> }],
          },
          {
            element: <RequirePermission slug="user:update" />,
            children: [{ path: '/users/:id/edit', element: <EditUserPage /> }],
          },
          {
            element: <RequirePermission slug="role:read" />,
            children: [
              { path: '/roles', element: <RolesListPage /> },
              { path: '/roles/:id', element: <RoleDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="role:create" />,
            children: [{ path: '/roles/new', element: <CreateRolePage /> }],
          },
          {
            element: <RequirePermission slug="role:update" />,
            children: [{ path: '/roles/:id/edit', element: <EditRolePage /> }],
          },
          {
            element: <RequirePermission slug="contrat:read" />,
            children: [
              { path: '/contrats', element: <ContratsListPage /> },
              { path: '/contrats/expirations', element: <ContratExpirationsPage /> },
              { path: '/contrats/:id', element: <ContratDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="contrat:create" />,
            children: [{ path: '/contrats/new', element: <CreateContratPage /> }],
          },
          {
            element: <RequirePermission slug="absence:read" />,
            children: [
              { path: '/absences', element: <AbsencesListPage /> },
              { path: '/absences/:userId/:mois/:annee', element: <AbsenceDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="absence:create" />,
            children: [{ path: '/absences/new', element: <CreateAbsencePage /> }],
          },
          {
            element: <RequirePermission slug="retard:read" />,
            children: [
              { path: '/retards', element: <RetardsListPage /> },
              { path: '/retards/:userId/:mois/:annee', element: <RetardDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="retard:create" />,
            children: [{ path: '/retards/new', element: <CreateRetardPage /> }],
          },
          {
            element: <RequirePermission slug="salaire:read" />,
            children: [
              { path: '/salaires', element: <SalairesListPage /> },
              { path: '/salaires/masse-salariale', element: <MasseSalarialePage /> },
              { path: '/salaires/historique/:userId', element: <HistoriquePaiementsPage /> },
              { path: '/salaires/:id', element: <SalaireDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="salaire:create" />,
            children: [{ path: '/salaires/new', element: <InitialiserSalairePage /> }],
          },
          {
            element: <RequirePermission slug="contrat:update" />,
            children: [{ path: '/contrats/:id/edit', element: <EditContratPage /> }],
          },
          {
            element: <RequirePermission slug="department:read" />,
            children: [
              { path: '/departments', element: <DepartmentsListPage /> },
              { path: '/departments/:id', element: <DepartmentDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="department:create" />,
            children: [{ path: '/departments/new', element: <CreateDepartmentPage /> }],
          },
          {
            element: <RequirePermission slug="department:update" />,
            children: [{ path: '/departments/:id/edit', element: <EditDepartmentPage /> }],
          },
          {
            element: <RequirePermission slug="rapport:read" />,
            children: [
              { path: '/rapports', element: <RapportsListPage /> },
              { path: '/rapports/:id', element: <RapportDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="rapport:create" />,
            children: [{ path: '/rapports/new', element: <CreateRapportPage /> }],
          },
          {
            element: <RequirePermission slug="article:read" />,
            children: [
              { path: '/articles', element: <ArticlesListPage /> },
              { path: '/articles/:id', element: <ArticleDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="article:create" />,
            children: [{ path: '/articles/new', element: <CreateArticlePage /> }],
          },
          {
            element: <RequirePermission slug="article:update" />,
            children: [{ path: '/articles/:id/edit', element: <EditArticlePage /> }],
          },
          {
            element: <RequirePermission slug="category:read" />,
            children: [
              { path: '/categories', element: <CategoriesListPage /> },
              { path: '/categories/:id', element: <CategoryDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="category:create" />,
            children: [{ path: '/categories/new', element: <CreateCategoryPage /> }],
          },
          {
            element: <RequirePermission slug="category:update" />,
            children: [{ path: '/categories/:id/edit', element: <EditCategoryPage /> }],
          },
          {
            element: <RequirePermission slug="movement:read" />,
            children: [
              { path: '/mouvements-stock', element: <StockOverviewPage /> },
              { path: '/mouvements-stock/alertes', element: <StockAlertsPage /> },
              { path: '/mouvements-stock/historique', element: <MouvementsHistoryPage /> },
            ],
          },
          {
            element: <RequirePermission slug="movement:create" />,
            children: [{ path: '/mouvements-stock/new', element: <CreateMovementPage /> }],
          },
          {
            element: <RequirePermission slug="salessession:read" />,
            children: [
              { path: '/sessions', element: <SessionsListPage /> },
              { path: '/sessions/:id', element: <SessionDetailPage /> },
            ],
          },
          {
            element: <RequirePermission slug="salessession:create" />,
            children: [{ path: '/sessions/new', element: <CreateSessionPage /> }],
          },
        ],
      },
    ],
  },
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
