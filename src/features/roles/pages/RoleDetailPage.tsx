import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRoleQuery } from '../api/roles.queries';
import { DeleteRoleDialog } from '../components/DeleteRoleDialog';
import { groupRolePermissionsByResource, formatDate } from '../lib/roleDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);
  const navigate = useNavigate();
  const { data: role, isLoading, isError, error } = useRoleQuery(roleId);
  const canUpdate = usePermission('role:update');
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

  const permissionGroups = groupRolePermissionsByResource(role.permissions);  

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <nav className="mb-sm flex items-center gap-xs font-label-sm text-label-sm text-outline">
            <Link to="/roles" className="hover:text-primary">
              Rôles
            </Link>
            <span className="mx-1">/</span>
            <span className="text-on-surface">Détail du rôle</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-primary">{role.post}</h2>
        </div>
        <div className="flex gap-md">
          {canUpdate ? (
            <Link to={`/roles/${role.id}/edit`}>
              <Button variant="outline">
                <Icon name="edit" />
                Modifier
              </Button>
            </Link>
          ) : (
            <Button variant="outline" title="Permission role:update requise" disabled>
              <Icon name="edit" />
              Modifier
            </Button>
          )}
          <Button
            variant="danger"
            title={canDelete ? 'Supprimer' : 'Permission role:delete requise'}
            disabled={!canDelete}
            onClick={() => setDeleting(true)}
          >
            <Icon name="delete" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        {/* Colonne principale */}
        <section className="col-span-12 space-y-lg lg:col-span-8">
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-on-surface">
              <Icon name="info" className="text-primary" />
              Informations générales
            </h3>
            <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Poste</label>
                <p className="rounded-lg border border-outline-variant/30 bg-surface p-md font-body-md text-body-md text-on-surface">
                  {role.post}
                </p>
              </div>
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                  Département
                </label>
                <p className="rounded-lg border border-outline-variant/30 bg-surface p-md font-body-md text-body-md text-on-surface">
                  {role.department?.name ?? '—'}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">nomRole</label>
                <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-highest p-md font-label-md text-label-md text-on-surface-variant">
                  {role.nomRole}
                </p>
                <span className="mt-2 flex items-center gap-1 font-label-sm text-label-sm italic text-tertiary">
                  <Icon name="auto_awesome" className="text-[14px]" />
                  Généré automatiquement
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-on-surface">
              <Icon name="verified_user" className="text-primary" />
              Permissions assignées
            </h3>
            {permissionGroups.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Aucune permission assignée à ce rôle.
              </p>
            ) : (
              <div className="space-y-lg">
                {permissionGroups.map((group) => (
                  <div key={group.resource}>
                    <h4 className="mb-md inline-block rounded bg-primary-container px-sm py-xs font-label-md text-label-md text-on-primary-container">
                      {group.label}
                    </h4>
                    <div className="flex flex-wrap gap-sm">
                      {group.permissions.map((permission) => (
                        <span
                          key={permission.id}
                          title={permission.description}
                          className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-md py-sm font-label-md text-label-md text-on-surface"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {permission.slug}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Colonne latérale */}
        <aside className="col-span-12 space-y-lg lg:col-span-4">
          <div className="flex max-h-[600px] flex-col rounded-xl border border-outline-variant bg-surface-container-low">
            <div className="border-b border-outline-variant p-lg">
              <h3 className="flex items-center gap-sm font-title-md text-title-md text-on-surface">
                <Icon name="person" className="text-primary" />
                Utilisateurs ayant ce rôle
              </h3>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {role.users.length} utilisateur{role.users.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-md overflow-y-auto p-md">
              {role.users.length === 0 ? (
                <p className="p-md text-center font-body-sm text-body-sm text-on-surface-variant">
                  Aucun utilisateur n'a ce rôle pour l'instant.
                </p>
              ) : (
                role.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-md rounded-xl border border-outline-variant/20 bg-surface p-md transition-colors hover:border-primary/30"
                  >
                    <Avatar
                      firstName={u.firstName}
                      lastName={u.lastName}
                      src={u.profilePicture}
                      className="h-10 w-10 font-bold"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-label-md text-label-md text-on-surface">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="truncate font-label-sm text-label-sm text-on-surface-variant">
                        {u.email}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {role.users.length > 0 && (
              <div className="mt-auto bg-surface-container-high/50 p-lg text-center">
                <Link
                  to={`/users?roleId=${role.id}`}
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  Voir tous les utilisateurs
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-md flex items-center gap-sm font-title-md text-title-md text-on-surface">
              <Icon name="history" className="text-primary" />
              Historique
            </h3>
            <div className="space-y-sm font-body-sm text-body-sm text-on-surface-variant">
              <p>Créé le {formatDate(role.createdAt)}</p>
              <p>Dernière modification le {formatDate(role.updatedAt)}</p>
            </div>
          </div>
        </aside>
      </div>

      <DeleteRoleDialog
        role={deleting ? role : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate('/roles', { replace: true })}
      />
    </>
  );
}
