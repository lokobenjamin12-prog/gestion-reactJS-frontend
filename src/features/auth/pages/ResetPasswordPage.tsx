import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth.schemas';
import { useResetPasswordMutation } from '../api/auth.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';
import { AuthTopBar } from '../components/AuthTopBar';
import { AuthFooter } from '../components/AuthFooter';

const passwordRequirements = [
  { key: 'length', label: '8 caractères minimum', test: (v: string) => v.length >= 8 },
  { key: 'upper', label: 'Une majuscule (A-Z)', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Une minuscule (a-z)', test: (v: string) => /[a-z]/.test(v) },
  { key: 'number', label: 'Un chiffre (0-9)', test: (v: string) => /[0-9]/.test(v) },
  { key: 'special', label: 'Un caractère spécial (@ $ ! % * ? &)', test: (v: string) => /[@$!%*?&]/.test(v) },
];

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const resetPasswordMutation = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit((values) => {
    resetPasswordMutation.mutate(
      { token: values.token, newPassword: values.newPassword },
      { onSuccess: () => navigate('/auth/login', { replace: true }) },
    );
  });

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col">
        <AuthTopBar />
        <main className="flex flex-grow items-center justify-center px-md pb-16 pt-24">
          <div className="w-full max-w-[440px] rounded-xl border border-outline-variant bg-white p-xl text-center shadow-sm">
            <div className="mx-auto mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
              <Icon name="link_off" className="text-[32px] text-error" />
            </div>
            <h1 className="font-display-sm text-display-sm mb-xs text-on-surface">Lien invalide</h1>
            <p className="font-body-sm text-body-sm mb-xl text-secondary">
              Ce lien de réinitialisation a expiré ou est invalide. Pour des raisons de sécurité, les liens de mot
              de passe ne sont valables que pendant 1 heure.
            </p>
            <div className="space-y-md">
              <Link to="/auth/forgot-password" className="block">
                <Button className="w-full">Demander un nouveau lien</Button>
              </Link>
              <Link to="/auth/login" className="block">
                <Button variant="outline" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AuthTopBar />
      <main className="flex flex-grow items-center justify-center px-md pb-16 pt-24">
        <div className="w-full max-w-[440px] rounded-xl border border-outline-variant bg-white p-xl shadow-sm">
          <div className="mb-lg">
            <h1 className="font-display-sm text-display-sm mb-xs text-primary">Nouveau mot de passe</h1>
            <p className="font-body-sm text-body-sm text-secondary">
              Veuillez sécuriser votre compte avec un nouveau mot de passe robuste.
            </p>
          </div>

          {resetPasswordMutation.isError && (
            <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
              <Icon name="error" className="mt-0.5 text-[20px]" />
              <p className="font-body-sm text-body-sm">{getApiErrorMessage(resetPasswordMutation.error)}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-md" noValidate>
            <input type="hidden" {...register('token')} />

            <Input
              label="Nouveau mot de passe"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              trailing={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-outline transition-colors hover:text-primary"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              }
              {...register('newPassword')}
            />

            <Input
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              trailing={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="text-outline transition-colors hover:text-primary"
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} />
                </button>
              }
              {...register('confirmPassword')}
            />

            <div className="space-y-sm rounded-lg bg-surface-container-low p-md">
              <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Exigences de sécurité
              </h3>
              <ul className="space-y-base">
                {passwordRequirements.map((req) => {
                  const met = req.test(newPassword ?? '');
                  return (
                    <li
                      key={req.key}
                      className={`flex items-center gap-sm text-body-sm transition-colors ${
                        met ? 'text-emerald-600' : 'text-outline'
                      }`}
                    >
                      <Icon name={met ? 'check_circle' : 'circle'} filled={met} className="text-[18px]" />
                      <span>{req.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Button type="submit" className="mt-md w-full" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                'Réinitialiser'
              )}
            </Button>
          </form>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
