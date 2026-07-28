import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDepartmentQuery } from '../api/departments.queries';
import { DeleteDepartmentDialog } from '../components/DeleteDepartmentDialog';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';

export function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const departmentId = Number(id);
  const navigate = useNavigate();
  const { data: department, isLoading, isError, error } = useDepartmentQuery(departmentId);
  const canUpdate = usePermission('department:update');
  const canDelete = usePermission('department:delete');
  const [deleting, setDeleting] = useState(false);
  //const [isUpdateing , setUpdating] = useState(true);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  // if(isUpdateing){
  //   setUpdating(false);
  //   return true;
  // }

  if (isError || !department) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, 'Impossible de charger ce département.')}
      </div>
    );
  }

  const roles = department.roles ?? [];
  const roleCount = department._count?.roles ?? roles.length;
  const totalEffectif = roles.reduce((sum, role) => sum + (role._count?.users ?? 0), 0);

  return (
    <>
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <Link to="/departments" className="hover:text-primary">
          Départements
        </Link>
        <span className="mx-1">/</span>
        <span className="text-on-surface">{department.name}</span>
      </nav>

      <div className="mb-xl flex flex-col justify-between gap-lg md:flex-row md:items-end">
        <div className="flex items-center gap-md">
          <span className="rounded-lg bg-primary px-xl py-xs font-headline-lg text-headline-lg uppercase tracking-wider text-on-primary">
            {department.name}
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed">
            <Icon name="apartment" className="text-on-primary-fixed" />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {canUpdate ? (
            <Link to={`/departments/${department.id}/edit`}>
              <Button variant="outline">
                <Icon name="edit" className="text-[20px]" />
                Modifier
              </Button>
            </Link>
          ) : (
            <Button variant="outline" title="Permission department:update requise" disabled>
              <Icon name="edit" className="text-[20px]" />
              Modifier
            </Button>
          )}
          <Button
            variant="danger"
            title={canDelete ? 'Supprimer' : 'Permission department:delete requise'}
            disabled={!canDelete}
            onClick={() => setDeleting(true)}
          >
            <Icon name="delete" className="text-[20px]" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* Rôles rattachés */}
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-lg py-md">
            <div className="flex items-center gap-sm">
              <Icon name="groups" className="text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface">Rôles rattachés</h3>
            </div>
            <span className="rounded-full bg-secondary-fixed px-md py-xs font-label-sm text-label-sm text-on-secondary-fixed-variant">
              {roleCount} rôle{roleCount > 1 ? 's' : ''}
            </span>
          </div>

          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-lg flex h-32 w-32 items-center justify-center rounded-full bg-surface-container-high">
                <Icon name="folder_off" className="text-[48px] text-outline opacity-30" />
              </div>
              <h3 className="mb-xs font-title-md text-title-md font-bold text-on-surface">Aucun rôle rattaché</h3>
              <p className="mb-xl max-w-[24rem] font-body-md text-body-md text-on-surface-variant">
                Ce département n'a pas encore de rôle. Vous pouvez en créer un et lui assigner ce département.
              </p>
              <Link to="/roles/new">
                <Button>
                  <Icon name="add" />
                  Créer un rôle
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="divide-y divide-outline-variant">
                {roles.map((role) => (
                  <Link
                    key={role.id}
                    to={`/roles/${role.id}`}
                    className="group flex items-center justify-between p-lg transition-colors hover:bg-surface-container-low"
                  >
                    <div className="flex items-center gap-lg">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high transition-colors group-hover:bg-primary">
                        <Icon name="shield_person" className="text-on-surface-variant group-hover:text-on-primary" />
                      </div>
                      <div>
                        <h4 className="font-body-md text-body-md font-bold text-on-surface">{role.post}</h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{role.nomRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-xl">
                      <div className="text-right">
                        <span className="mb-1 block font-label-sm text-label-sm uppercase text-outline">
                          Utilisateurs
                        </span>
                        <span className="font-title-md text-title-md text-primary">
                          {String(role._count?.users ?? 0).padStart(2, '0')}
                        </span>
                      </div>
                      <Icon
                        name="chevron_right"
                        className="text-outline transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary"
                      />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center border-t border-outline-variant bg-surface-container p-md">
                <Link
                  to="/roles/new"
                  className="flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
                >
                  <Icon name="add_circle" className="text-[18px]" />
                  Créer un rôle
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Résumé */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md font-label-md text-label-md uppercase text-on-surface-variant">Résumé</h3>
            <div className="space-y-md">
              <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-md">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Rôles rattachés</span>
                <span className="font-title-md text-title-md font-bold text-primary">{roleCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-md">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Effectif total</span>
                <span className="font-title-md text-title-md font-bold text-primary">{totalEffectif}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteDepartmentDialog
        department={deleting ? department : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate('/departments', { replace: true })}
      />
    </>
  );
}
