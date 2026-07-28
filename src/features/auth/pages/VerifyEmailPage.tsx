import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useResendVerificationMutation, useVerifyEmailMutation } from '../api/auth.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';
import { AuthTopBar } from '../components/AuthTopBar';
import { AuthFooter } from '../components/AuthFooter';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const verifyEmailMutation = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();
  const hasStarted = useRef(false);
  const [resendEmail, setResendEmail] = useState('');
  // État local piloté directement par les callbacks onSuccess/onError de .mutate() —
  // ne dépend pas de la réactivité de l'objet mutation lui-même, pour rester fiable
  // même si le composant parent (AuthBootstrap) se re-rend pendant l'opération.
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(token ? 'pending' : 'error');

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    verifyEmailMutation.mutate(token, {
      onSuccess: () => setStatus('success'),
      onError: () => setStatus('error'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onResendSubmit = (e: FormEvent) => {
    e.preventDefault();
    resendMutation.mutate(resendEmail);
  };

  const isError = status === 'error';
  const isSuccess = status === 'success';

  return (
    <div className="flex min-h-screen flex-col">
      <AuthTopBar />
      <main className="flex flex-grow items-center justify-center px-md pb-16 pt-24">
        <div className="relative w-full max-w-[440px] overflow-hidden rounded-xl border border-outline-variant bg-white p-xl shadow-sm">
          <div className="pointer-events-none absolute right-0 top-0 p-lg opacity-10">
            <Icon name="verified_user" className="select-none text-[120px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {isSuccess ? (
              <>
                <div className="mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <Icon name="check_circle" filled className="text-4xl text-emerald-600" />
                </div>
                <h2 className="font-headline-md text-headline-md mb-sm text-on-surface">
                  Compte activé avec succès !
                </h2>
                <p className="font-body-md text-body-md mb-lg text-on-surface-variant">
                  Votre email a été vérifié. Votre compte est maintenant actif.
                </p>
                <Link to="/dashboard" className="w-full">
                  <Button className="w-full">
                    <Icon name="login" className="text-sm" />
                    Accéder à mon espace
                  </Button>
                </Link>
              </>
            ) : isError ? (
              <>
                <div className="mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
                  <Icon name="error" className="text-4xl text-error" />
                </div>
                <h2 className="font-headline-md text-headline-md mb-sm text-on-surface">Lien invalide ou expiré</h2>
                <p className="font-body-md text-body-md mb-lg text-on-surface-variant">
                  {token
                    ? getApiErrorMessage(
                        verifyEmailMutation.error,
                        "Ce lien de vérification n'est plus valide ou a expiré.",
                      )
                    : "Ce lien de vérification n'est plus valide ou a expiré."}
                </p>

                {resendMutation.isSuccess ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{resendMutation.data.message}</p>
                ) : (
                  <form onSubmit={onResendSubmit} className="w-full space-y-md text-left">
                    <Input
                      label="Email"
                      type="email"
                      required
                      placeholder="nom@entreprise.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                    />
                    {resendMutation.isError && (
                      <p className="font-body-sm text-body-sm text-error">
                        {getApiErrorMessage(resendMutation.error)}
                      </p>
                    )}
                    <Button type="submit" className="w-full" disabled={resendMutation.isPending}>
                      {resendMutation.isPending ? (
                        <Icon name="progress_activity" className="animate-spin" />
                      ) : (
                        'Recevoir un nouveau lien de vérification'
                      )}
                    </Button>
                  </form>
                )}

                <Link
                  to="/auth/login"
                  className="font-label-md text-label-md mt-md text-on-surface-variant hover:text-primary"
                >
                  Retour à la connexion
                </Link>
              </>
            ) : (
              <>
                <div className="mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
                  <Icon name="sync" className="animate-spin text-4xl text-primary" />
                </div>
                <h2 className="font-headline-md text-headline-md mb-sm text-on-surface">
                  Activation de votre compte en cours…
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Veuillez patienter pendant que nous validons vos informations.
                </p>
                <div className="mt-lg h-1 w-full overflow-hidden rounded-full bg-surface-container-low">
                  <div className="auth-progress-bar h-full w-1/3 bg-primary" />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
