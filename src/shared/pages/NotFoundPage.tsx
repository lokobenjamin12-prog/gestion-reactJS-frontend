import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-900">Page introuvable</h1>
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  );
}
