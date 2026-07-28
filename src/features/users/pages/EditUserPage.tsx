import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUserQuery, useUpdateUserMutation, useUploadProfilePictureMutation } from '../api/users.queries';
import { useRolesQuery } from '@/features/roles/api/roles.queries';
import { updateUserSchema, toUpdateUserPayload, type UpdateUserFormValues } from '../schemas/user.schemas';
import { ArchiveUserDialog } from '../components/ArchiveUserDialog';
import { RestoreUserDialog } from '../components/RestoreUserDialog';
import { getStatusBadge } from '../lib/userDisplay';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const MAX_PICTURE_SIZE = 2 * 1024 * 1024; // 2 Mo — même limite que le backend
const ALLOWED_PICTURE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, isError, error } = useUserQuery(id!);
  const { data: rolesData } = useRolesQuery();
  const updateUserMutation = useUpdateUserMutation();
  const canArchive = usePermission('user:archive');
  const canRestore = usePermission('user:restore');
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  if (isLoading) {
    return <div className="py-xl text-center text-on-surface-variant">Chargement…</div>;
  }

  if (isError || !user) {
    return (
      <div className="py-xl text-center text-error">
        {getApiErrorMessage(error, "Impossible de charger cet utilisateur.")}
      </div>
    );
  }

  return (
    <EditUserForm
      user={user}
      roles={rolesData?.data ?? []}
      canArchive={canArchive}
      canRestore={canRestore}
      updateUserMutation={updateUserMutation}
      onArchive={() => setArchiving(true)}
      archivingUser={archiving ? user : null}
      onCloseArchive={() => setArchiving(false)}
      onArchived={() => {
        setArchiving(false);
        navigate('/users', { replace: true });
      }}
      onRestore={() => setRestoring(true)}
      restoringUser={restoring ? user : null}
      onCloseRestore={() => setRestoring(false)}
      onRestored={() => {
        setRestoring(false);
        navigate(`/users/${user.id}`, { replace: true });
      }}
      onSaved={() => {
        navigate(`/users/${user.id}`, { replace: true });
      }}
    />
  );
}

interface EditUserFormProps {
  user: NonNullable<ReturnType<typeof useUserQuery>['data']>;
  roles: { id: number; nomRole: string }[];
  canArchive: boolean;
  canRestore: boolean;
  updateUserMutation: ReturnType<typeof useUpdateUserMutation>;
  onArchive: () => void;
  archivingUser: EditUserFormProps['user'] | null;
  onCloseArchive: () => void;
  onArchived: () => void;
  onRestore: () => void;
  restoringUser: EditUserFormProps['user'] | null;
  onCloseRestore: () => void;
  onRestored: () => void;
  onSaved: () => void;
}

function EditUserForm({
  user,
  roles,
  canArchive,
  canRestore,
  updateUserMutation,
  onArchive,
  archivingUser,
  onCloseArchive,
  onArchived,
  onRestore,
  restoringUser,
  onCloseRestore,
  onRestored,
  onSaved,
}: EditUserFormProps) {
  const badge = getStatusBadge(user);
  const errorRef = useScrollToError(updateUserMutation.isError);
  const uploadPictureMutation = useUploadProfilePictureMutation();
  const [pictureError, setPictureError] = useState<string | null>(null);

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier ensuite
    if (!file) return;

    if (!ALLOWED_PICTURE_TYPES.includes(file.type)) {
      setPictureError('Seuls les formats JPG et PNG sont acceptés.');
      return;
    }
    if (file.size > MAX_PICTURE_SIZE) {
      setPictureError('Le fichier ne doit pas dépasser 2 Mo.');
      return;
    }
    setPictureError(null);
    uploadPictureMutation.mutate({ id: user.id, file });
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      whatsappNumber: user.whatsappNumber ?? '',
      roleId: String(user.role.id),
      dateNaissance: user.dateNaissance?.slice(0, 10) ?? '',
      dateRecrutement: user.dateRecrutement?.slice(0, 10) ?? '',
      adresse: user.adresse ?? '',
      salaireBase: user.salaireBase,
      typeHoraire: user.typeHoraire,
      quotaCongesAnnuel: String(user.quotaCongesAnnuel),
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateUserMutation.mutate(
      { id: user.id, payload: toUpdateUserPayload(values) },
      { onSuccess: onSaved },
    );
  });

  return (
    <>
      <nav className="mb-md flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
        <Link to="/users" className="hover:text-primary">
          Utilisateurs
        </Link>
        <Icon name="chevron_right" className="text-sm text-outline" />
        <span className="text-primary">Modification</span>
      </nav>

      <div className="mb-xl flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary">Modifier l'utilisateur</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Mettez à jour les informations de profil et les permissions.
          </p>
        </div>
        <Link to={`/users/${user.id}`}>
          <Button variant="outline" type="button">
            <Icon name="arrow_back" />
            Retour
          </Button>
        </Link>
      </div>

      {updateUserMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(updateUserMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-lg md:grid-cols-12" noValidate>
        {/* Colonne gauche */}
        <div className="space-y-lg md:col-span-8">
          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-primary">
              <Icon name="person_outline" />
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Input label="Prénom" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Nom" error={errors.lastName?.message} {...register('lastName')} />
              <div className="sm:col-span-2">
                <Input
                  label="Adresse e-mail (lecture seule)"
                  value={user.email}
                  readOnly
                  disabled
                  hint="L'adresse email est utilisée comme identifiant unique et ne peut être modifiée."
                  icon="lock"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Numéro de téléphone"
                  type="tel"
                  error={errors.phoneNumber?.message}
                  {...register('phoneNumber')}
                />
              </div>
              <Input
                label="WhatsApp (optionnel)"
                type="tel"
                error={errors.whatsappNumber?.message}
                {...register('whatsappNumber')}
              />
              <Input
                label="Date de naissance (optionnel)"
                type="date"
                error={errors.dateNaissance?.message}
                {...register('dateNaissance')}
              />
              <div className="sm:col-span-2">
                <Input label="Localisation (optionnel)" error={errors.adresse?.message} {...register('adresse')} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-lg flex items-center gap-sm font-title-md text-title-md text-primary">
              <Icon name="work_outline" />
              Détails professionnels
            </h3>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Input
                label="Date de recrutement (optionnel)"
                type="date"
                error={errors.dateRecrutement?.message}
                {...register('dateRecrutement')}
              />
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Horaire</label>
                <Select className="w-full" {...register('typeHoraire')}>
                  <option value="JOUR">JOUR</option>
                  <option value="NUIT">NUIT</option>
                  <option value="MIXTE">MIXTE</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Salaire de base (optionnel)"
                  type="number"
                  error={errors.salaireBase?.message}
                  {...register('salaireBase')}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Congés annuels (optionnel)"
                  type="number"
                  error={errors.quotaCongesAnnuel?.message}
                  {...register('quotaCongesAnnuel')}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-lg md:col-span-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
            <div className="relative mx-auto mb-md h-32 w-32">
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                src={user.profilePicture}
                className="h-full w-full border-4 border-surface text-3xl shadow-md"
              />
              <label
                title={uploadPictureMutation.isPending ? 'Envoi en cours...' : 'Changer la photo'}
                className={`absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-surface-container-low bg-primary text-on-primary transition-opacity ${
                  uploadPictureMutation.isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90'
                }`}
              >
                {uploadPictureMutation.isPending ? (
                  <Icon name="progress_activity" className="animate-spin text-[18px]" />
                ) : (
                  <Icon name="photo_camera" className="text-[18px]" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  disabled={uploadPictureMutation.isPending}
                  onChange={handlePictureChange}
                />
              </label>
            </div>
            {pictureError && <p className="mb-md font-body-sm text-body-sm text-error">{pictureError}</p>}
            <h4 className="mb-xs font-title-md text-title-md text-on-surface">
              {user.firstName} {user.lastName}
            </h4>
            <p
              className={`font-label-md text-[10px] uppercase tracking-widest ${badge.textClass}`}
            >
              {badge.label}
            </p>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-low p-lg">
            <h3 className="mb-md flex items-center gap-sm font-title-md text-title-md text-primary">
              <Icon name="settings_account_box" />
              Compte
            </h3>
            <div className="space-y-md">
              <div className="flex items-center justify-between rounded-lg p-sm">
                <div>
                  <p className="font-label-md text-label-md text-on-surface">Statut du compte</p>
                  <p className="text-[10px] text-on-surface-variant">Actif / Suspendu</p>
                </div>
                <span
                  title="Bientôt disponible — aucune route de désactivation distincte de l'archivage pour l'instant"
                  className="font-label-sm text-label-sm text-on-surface-variant"
                >
                  <Icon name="info" className="text-[16px]" />
                </span>
              </div>
              <div>
                <label className="mb-1 block font-label-md text-label-md text-on-surface">Rôle assigné</label>
                <Select className="w-full" {...register('roleId')}>
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nomRole}
                    </option>
                  ))}
                </Select>
                {errors.roleId && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.roleId.message}</p>}
              </div>
              <div className="rounded-lg border border-on-tertiary-container/10 bg-tertiary-fixed p-md text-on-tertiary-fixed">
                <div className="flex gap-sm">
                  <Icon name="info" className="text-[20px]" />
                  <div>
                    <p className="font-label-md leading-tight">Note de sécurité</p>
                    <p className="mt-xs text-[10px] opacity-80">
                      Le champ mot de passe n'est pas disponible en modification directe pour des raisons de
                      sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-md pt-md">
            <Button type="submit" className="w-full" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? (
                <Icon name="progress_activity" className="animate-spin" />
              ) : (
                <>
                  <Icon name="save" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
            {user.estArchive ? (
              <Button
                type="button"
                className="w-full"
                title={canRestore ? 'Restaurer' : 'Permission user:restore requise'}
                disabled={!canRestore}
                onClick={onRestore}
              >
                <Icon name="unarchive" />
                Restaurer l'utilisateur
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                className="w-full"
                title={canArchive ? 'Archiver' : 'Permission user:archive requise'}
                disabled={!canArchive}
                onClick={onArchive}
              >
                <Icon name="archive" />
                Archiver l'utilisateur
              </Button>
            )}
          </div>
        </div>
      </form>

      <ArchiveUserDialog user={archivingUser} onClose={onCloseArchive} onArchived={onArchived} />
      <RestoreUserDialog user={restoringUser} onClose={onCloseRestore} onRestored={onRestored} />
    </>
  );
}
