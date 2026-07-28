import type { ReactNode } from 'react';
import { Icon } from '@/shared/ui/Icon';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="auth-bg-pattern flex min-h-screen w-full flex-col items-center justify-center p-md">
      <div className="flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-lg text-center">
          <div className="mb-md inline-flex items-center justify-center rounded-xl bg-primary p-md">
            <Icon name="corporate_fare" filled className="text-[32px] text-white" />
          </div>
          <h1 className="font-display-sm text-display-sm font-bold text-primary">Ndolecam</h1>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            Hoozon SARL — Portail de gestion sécurisé
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
