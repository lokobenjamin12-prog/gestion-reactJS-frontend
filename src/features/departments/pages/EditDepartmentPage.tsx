import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDepartmentQuery, useUpdateDepartmentMutation } from '../api/departments.queries';
import { updateDepartmentSchema, toUpdateDepartmentPayload, type UpdateDepartmentFormValues } from '../schemas/department.schemas';
import type { Department } from '../types/department.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

export function EditDepartmentPage() {
  const { id } = useParams<{ id: string }>();
  const departmentId = Number(id);
  const navigate = useNavigate();
  const { data: department, isLoading, isError, error } = useDepartmentQuery(departmentId);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !department) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce département.')}
      </div>
    );
  }

  return (
    <EditDepartmentForm
      department={department}
      onSaved={() => navigate(`/departments/${department.id}`, { replace: true })}
    />
  );
}

interface EditDepartmentFormProps {
  department: Department;
  onSaved: () => void;
}

function EditDepartmentForm({ department, onSaved }: EditDepartmentFormProps) {
  const updateDepartmentMutation = useUpdateDepartmentMutation();
  const errorRef = useScrollToError(updateDepartmentMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateDepartmentFormValues>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: { name: department.name },
  });

  const nameField = register('name');

  const roles = department.roles ?? [];
  const roleCount = department._count?.roles ?? roles.length;
  const totalEffectif = roles.reduce((sum, role) => sum + (role._count?.users ?? 0), 0);

  const onSubmit = handleSubmit((values) => {
    updateDepartmentMutation.mutate(
      { id: department.id, payload: toUpdateDepartmentPayload(values) },
      { onSuccess: onSaved },
    );
  });

  return (
    <>
      <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <Link to="/departments" className="hover:text-primary">
          Départements
        </Link>
        <span className="mx-1">/</span>
        <span className="text-primary">Modifier</span>
      </nav>
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Modifier le département</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Mettez à jour les informations du département sélectionné.
        </p>
      </div>

      {updateDepartmentMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(updateDepartmentMutation.error)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-xl">
            <form onSubmit={onSubmit} className="space-y-xl" noValidate>
              <Input
                label="Nom du département"
                hint="Le nom sera automatiquement mis en majuscules et doit rester unique."
                error={errors.name?.message}
                {...nameField}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  return nameField.onChange(e);
                }}
              />

              <div className="flex items-center justify-end gap-md border-t border-outline-variant pt-lg">
                <Link to={`/departments/${department.id}`}>
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={updateDepartmentMutation.isPending}>
                  {updateDepartmentMutation.isPending ? (
                    <Icon name="progress_activity" className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="save" className="text-[20px]" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-gutter lg:col-span-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-md font-title-md text-title-md text-primary">Aperçu rapide</h3>
            <div className="space-y-md">
              <div className="flex items-center justify-between border-b border-outline-variant py-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Rôles rattachés</span>
                <span className="rounded bg-secondary-container px-sm py-xs font-label-md text-label-md text-on-secondary-container">
                  {roleCount}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-outline-variant py-sm">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Effectif total</span>
                <span className="font-label-md text-label-md text-on-surface">{totalEffectif}</span>
              </div>
              {department.updatedAt && (
                <div className="flex items-center justify-between py-sm">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Dernière modif.</span>
                  <span className="font-label-md text-label-md text-on-surface">
                    {new Date(department.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-primary-container p-lg text-on-primary-container">
            <div className="flex items-start gap-md">
              <Icon name="info" className="text-on-primary-container" />
              <div className="space-y-xs">
                <p className="font-label-md font-bold">Besoin d'aide ?</p>
                <p className="font-body-sm text-body-sm opacity-90">
                  Le nom doit rester unique et sera automatiquement converti en majuscules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
