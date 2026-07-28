import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateRoleMutation } from '../api/roles.queries';
import { useDepartmentsQuery } from '@/features/departments/api/departments.queries';
import { usePermissionsQuery } from '@/features/permissions/api/permissions.queries';
import { createRoleSchema, toCreateRolePayload, type CreateRoleFormValues } from '../schemas/role.schemas';
import { groupPermissionsByResource, humanizeAction } from '../lib/roleDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function CreateRolePage() {
  const navigate = useNavigate();
  const createRoleMutation = useCreateRoleMutation();
  const { data: departmentsData } = useDepartmentsQuery();
  const { data: permissionsData } = usePermissionsQuery();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const errorRef = useScrollToError(createRoleMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
  });

  const permissionGroups = groupPermissionsByResource(permissionsData?.data ?? []);

  function toggleGroup(resource: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  }

  function togglePermission(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroupAll(resource: string) {
    const group = permissionGroups.find((g) => g.resource === resource);
    if (!group) return;
    const groupIds = group.permissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  const onSubmit = handleSubmit((values) => {
    createRoleMutation.mutate(toCreateRolePayload(values, Array.from(selectedIds)), {
      onSuccess: (data) => navigate(`/roles/${data.id}`, { replace: true }),
    });
  });

  return (
    <>
      <div className="mb-xl">
        <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
          <Link to="/roles" className="hover:text-primary">
            Rôles
          </Link>
          <Icon name="chevron_right" className="text-[16px]" />
          <span className="font-bold text-primary">Nouveau rôle</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-primary">Créer un rôle</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Définissez le poste, le département et les permissions accordées à ce rôle.
        </p>
      </div>

      {createRoleMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(createRoleMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-lg md:grid-cols-12" noValidate>
        {/* Informations générales */}
        <div className="flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-12">
          <div className="flex items-center gap-sm border-b border-outline-variant pb-sm">
            <Icon name="info" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Informations générales</h3>
          </div>
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            <Input
              label="Titre du poste"
              placeholder="Ex: Responsable de stock"
              error={errors.post?.message}
              {...register('post')}
            />
            <div>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Département</label>
              <Select className="w-full" {...register('departmentId')}>
                <option value="">Sélectionner un département</option>
                {departmentsData?.data.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              {errors.departmentId && (
                <p className="mt-xs font-body-sm text-body-sm text-error">{errors.departmentId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Matrice de permissions */}
        <div className="flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-12">
          <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
            <div className="flex items-center gap-sm">
              <Icon name="verified_user" className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface">Permissions</h3>
            </div>
            <span className="rounded-full bg-primary-container px-md py-xs font-label-sm text-label-sm text-on-primary-container">
              {selectedIds.size} permission{selectedIds.size > 1 ? 's' : ''} sélectionnée
              {selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          {permissionGroups.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Chargement des permissions…</p>
          ) : (
            <div className="space-y-sm">
              {permissionGroups.map((group) => {
                const isOpen = openGroups.has(group.resource);
                const groupIds = group.permissions.map((p) => p.id);
                const selectedInGroup = groupIds.filter((id) => selectedIds.has(id)).length;
                const allSelected = selectedInGroup === groupIds.length;

                return (
                  <div key={group.resource} className="rounded-lg border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.resource)}
                      className="flex w-full items-center justify-between gap-md p-md text-left"
                    >
                      <span className="flex items-center gap-sm">
                        <Icon name={group.icon} className="text-primary" />
                        <span className="font-title-sm text-title-sm text-on-surface">{group.label}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          ({selectedInGroup}/{groupIds.length})
                        </span>
                      </span>
                      <span className="flex items-center gap-md">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupAll(group.resource);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              toggleGroupAll(group.resource);
                            }
                          }}
                          className="font-label-sm text-label-sm text-primary hover:underline"
                        >
                          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </span>
                        <Icon name={isOpen ? 'expand_less' : 'expand_more'} className="text-outline" />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="flex flex-wrap gap-sm border-t border-outline-variant p-md">
                        {group.permissions.map((permission) => (
                          <label
                            key={permission.id}
                            title={permission.description}
                            className="flex cursor-pointer items-center gap-2 rounded-full border border-outline-variant bg-surface px-md py-sm font-label-md text-label-md text-on-surface transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-container has-[:checked]:text-on-primary-container"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={selectedIds.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            {humanizeAction(permission.slug)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-md flex justify-end gap-md border-t border-outline-variant pt-lg md:col-span-12">
          <Link to="/roles">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={createRoleMutation.isPending}>
            {createRoleMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="add" />
                Créer le rôle
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
