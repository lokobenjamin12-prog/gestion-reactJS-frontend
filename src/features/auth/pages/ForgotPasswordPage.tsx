import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schemas';
import { useForgotPasswordMutation } from '../api/auth.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';
import { AuthShell } from '../components/AuthShell';

export function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit((values) => {
    forgotPasswordMutation.mutate(values.email);
  });

  return (
    <AuthShell>
      <div className="w-full rounded-lg border border-outline-variant bg-white p-xl shadow-sm">
        {forgotPasswordMutation.isSuccess ? (
          <div className="space-y-md py-md text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Icon name="check_circle" className="text-emerald-600" />
            </div>
            <div className="space-y-sm">
              <h3 className="font-headline-md text-headline-md text-on-surface">Email envoyé</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {forgotPasswordMutation.data.message}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">Mot de passe oublié</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            {forgotPasswordMutation.isError && (
              <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
                <Icon name="error" className="mt-0.5 text-[20px]" />
                <p className="font-body-sm text-body-sm">{getApiErrorMessage(forgotPasswordMutation.error)}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-lg" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="nom@entreprise.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                {forgotPasswordMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  'Envoyer le lien'
                )}
              </Button>
            </form>
          </>
        )}

        <div className="mt-xl pt-lg border-t border-outline-variant text-center">
          <Link
            to="/auth/login"
            className="font-body-md text-body-md text-primary hover:underline inline-flex items-center justify-center gap-xs"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
