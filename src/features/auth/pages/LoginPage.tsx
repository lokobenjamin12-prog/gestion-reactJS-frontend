import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas';
import { useLoginMutation } from '../api/auth.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';
import { AuthShell } from '../components/AuthShell';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';
        navigate(from, { replace: true });
      },
    });
  });

  return (
    <AuthShell>
      <div className="auth-card w-full rounded-xl border border-outline-variant bg-white p-xl">
        <div className="mb-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface">Connexion</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Entrez vos identifiants pour accéder à votre espace.
          </p>
        </div>

        {loginMutation.isError && (
          <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
            <Icon name="error" className="mt-0.5 text-[20px]" />
            <p className="font-body-sm text-body-sm">{getApiErrorMessage(loginMutation.error)}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-lg" noValidate>
          <Input
            label="Email professionnel"
            type="email"
            autoComplete="email"
            placeholder="nom@entreprise.com"
            icon="mail"
            hint="Format attendu : utilisateur@domaine.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            icon="lock"
            error={errors.password?.message}
            labelRight={
              <Link
                to="/auth/forgot-password"
                className="font-label-md text-label-md text-primary-container hover:underline"
              >
                Mot de passe oublié?
              </Link>
            }
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="text-outline transition-colors hover:text-on-surface-variant"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            }
            {...register('password')}
          />

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Connexion…' : 'Se connecter'}
            {!loginMutation.isPending && <Icon name="login" />}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
