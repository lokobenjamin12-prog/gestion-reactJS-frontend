import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-900">Accès refusé</h1>
      <p className="text-sm text-slate-500">Vous n'avez pas la permission d'accéder à cette page.</p>
      <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
