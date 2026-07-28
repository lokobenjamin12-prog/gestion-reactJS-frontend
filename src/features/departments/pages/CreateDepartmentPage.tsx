import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateDepartmentMutation } from '../api/departments.queries';
import { createDepartmentSchema, toCreateDepartmentPayload, type CreateDepartmentFormValues } from '../schemas/department.schemas';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

export function CreateDepartmentPage() {
  const navigate = useNavigate();
  const createDepartmentMutation = useCreateDepartmentMutation();
  const errorRef = useScrollToError(createDepartmentMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
  });

  const nameField = register('name');

  const onSubmit = handleSubmit((values) => {
    createDepartmentMutation.mutate(toCreateDepartmentPayload(values), {
      onSuccess: (data) => navigate(`/departments/${data.id}`, { replace: true }),
    });
  });

  return (
    <div className="flex flex-1 items-center justify-center py-xl">
      <div className="w-full max-w-[36rem] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="space-y-xl p-xl">
          <div className="space-y-sm">
            <nav className="mb-xs flex items-center gap-xs font-label-sm text-label-sm text-outline">
              <Link to="/departments" className="hover:text-primary">
                Départements
              </Link>
              <span className="mx-1">/</span>
              <span className="text-primary">Nouveau</span>
            </nav>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Nouveau département</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Initialisation d'une nouvelle unité structurelle pour l'organisation.
            </p>
          </div>

          {createDepartmentMutation.isError && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
            >
              <Icon name="error" className="mt-0.5 text-[20px]" />
              <p className="font-body-sm text-body-sm">{getApiErrorMessage(createDepartmentMutation.error)}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-lg" noValidate>
            <Input
              label="Nom du département"
              placeholder="ex: Ressources Humaines"
              hint="Le nom sera automatiquement mis en majuscules et doit être unique."
              error={errors.name?.message}
              {...nameField}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                return nameField.onChange(e);
              }}
            />

            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high">
              <div className="flex flex-col items-center">
                <Icon name="schema" className="mb-sm text-[36px] text-primary-container" />
                <span className="font-label-md text-label-md text-on-surface-variant opacity-60">
                  Prévisualisation de l'arborescence
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-md border-t border-outline-variant pt-md">
              <Link to="/departments">
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={createDepartmentMutation.isPending}>
                {createDepartmentMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin" />
                ) : (
                  <>
                    Créer
                    <Icon name="add_circle" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
