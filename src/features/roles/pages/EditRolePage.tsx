import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRoleQuery, useUpdateRoleMutation } from '../api/roles.queries';
import { useDepartmentsQuery } from '@/features/departments/api/departments.queries';
import { usePermissionsQuery } from '@/features/permissions/api/permissions.queries';
import { updateRoleSchema, toUpdateRolePayload, type UpdateRoleFormValues } from '../schemas/role.schemas';
import { groupPermissionsByResource, humanizeAction } from '../lib/roleDisplay';
import { DeleteRoleDialog } from '../components/DeleteRoleDialog';
import type { RoleWithRelations } from '../types/role.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

export function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const navigate = useNavigate();
  const { data: role, isLoading, isError, error } = useRoleQuery(roleId);
  const canDelete = usePermission('role:delete');
  const [deleting, setDeleting] = useState(false);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !role) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce rôle.')}
      </div>
    );
  }

  return (
    <>
      <EditRoleForm
        role={role}
        canDelete={canDelete}
        onDelete={() => setDeleting(true)}
        onSaved={() => navigate(`/roles/${role.id}`, { replace: true })}
      />
      <DeleteRoleDialog
        role={deleting ? role : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate('/roles', { replace: true })}
      />
    </>
  );
}

interface EditRoleFormProps {
  role: RoleWithRelations;
  canDelete: boolean;
  onDelete: () => void;
  onSaved: () => void;
}

function EditRoleForm({ role, canDelete, onDelete, onSaved }: EditRoleFormProps) {
  const updateRoleMutation = useUpdateRoleMutation();
  const { data: departmentsData } = useDepartmentsQuery();
  const { data: permissionsData } = usePermissionsQuery();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(role.permissions.map((entry) => entry.permission.id)),
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const groups = groupPermissionsByResource(role.permissions.map((entry) => entry.permission));
    return new Set(groups.map((g) => g.resource));
  });
  const errorRef = useScrollToError(updateRoleMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateRoleFormValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      post: role.post,
      departmentId: String(role.departmentId),
    },
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
    const allSelected = groupIds.every((gId) => selectedIds.has(gId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((gId) => next.delete(gId));
      } else {
        groupIds.forEach((gId) => next.add(gId));
      }
      return next;
    });
  }

  function toggleAll(state: boolean) {
    if (!state) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(permissionGroups.flatMap((g) => g.permissions.map((p) => p.id))));
  }

  const onSubmit = handleSubmit((values) => {
    updateRoleMutation.mutate(
      { id: role.id, payload: toUpdateRolePayload(values, Array.from(selectedIds)) },
      { onSuccess: onSaved },
    );
  });

  return (
    <>
      <nav className="mb-md flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <Link to="/roles" className="hover:text-primary">
          Gestion des rôles
        </Link>
        <Icon name="chevron_right" className="text-sm text-outline" />
        <span className="text-primary">Modifier le rôle</span>
      </nav>

      <div className="mb-xl flex items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Modifier le rôle : {role.post}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Configurez les accès et les permissions détaillées pour ce profil de poste.
          </p>
        </div>
        <div className="flex items-center gap-md rounded-xl border border-outline-variant bg-surface-container-low px-lg py-sm">
          <div className="flex flex-col items-center">
            <span className="text-display-lg font-display-lg leading-tight text-primary">{selectedIds.size}</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Permissions actives
            </span>
          </div>
          <div className="mx-2 h-12 w-px bg-outline-variant" />
          <Icon name="verified" className="text-3xl text-secondary" />
        </div>
      </div>

      {updateRoleMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(updateRoleMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-lg" noValidate>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
          <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-on-surface">
            <Icon name="info" className="text-primary" />
            Informations générales
          </h3>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <Input label="Intitulé du poste" error={errors.post?.message} {...register('post')} />
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

        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
          <div className="mb-lg flex items-center justify-between">
            <h3 className="flex items-center gap-sm font-title-md text-title-md text-on-surface">
              <Icon name="key" className="text-primary" />
              Matrice des permissions
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="rounded px-2 py-1 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-primary-container/30"
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="rounded px-2 py-1 font-label-md text-label-md font-bold text-outline transition-colors hover:bg-surface-container-highest"
              >
                Tout décocher
              </button>
            </div>
          </div>

          {permissionGroups.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Chargement des permissions…</p>
          ) : (
            <div className="space-y-sm">
              {permissionGroups.map((group) => {
                const isOpen = openGroups.has(group.resource);
                const groupIds = group.permissions.map((p) => p.id);
                const selectedInGroup = groupIds.filter((gId) => selectedIds.has(gId)).length;
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

        <div className="flex items-center justify-between border-t border-outline-variant py-lg">
          <button
            type="button"
            title={canDelete ? 'Supprimer' : 'Permission role:delete requise'}
            disabled={!canDelete}
            onClick={onDelete}
            className="flex items-center gap-2 rounded px-md py-sm font-label-md text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="delete" />
            Supprimer ce rôle
          </button>
          <div className="flex gap-md">
            <Link to={`/roles/${role.id}`}>
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="save" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
