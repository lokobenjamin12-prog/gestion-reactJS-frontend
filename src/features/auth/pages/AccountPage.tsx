import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useChangePasswordMutation, useUpdateProfileMutation, useUploadMyProfilePictureMutation } from '../api/auth.queries';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormValues,
  type UpdateProfileFormValues,
} from '../schemas/auth.schemas';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/store/toast.store';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Icon } from '@/shared/ui/Icon';

const MAX_PICTURE_SIZE = 2 * 1024 * 1024; // 2 Mo — même limite que le backend
const ALLOWED_PICTURE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const uploadPictureMutation = useUploadMyProfilePictureMutation();
  const [pictureError, setPictureError] = useState<string | null>(null);

  if (!user) return null;

  const isActive = user.active && user.verified;

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
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
    uploadPictureMutation.mutate(file);
  }

  return (
    <>
      <div className="mb-xl flex flex-col items-center gap-lg border-b border-outline-variant pb-xl md:flex-row md:items-end">
        <div className="relative h-32 w-32 shrink-0">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            src={user.profilePicture}
            rounded="xl"
            className="h-full w-full border-4 border-surface text-[48px] shadow-sm"
          />
          <label
            title={uploadPictureMutation.isPending ? 'Envoi en cours...' : 'Changer la photo'}
            className={`absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-surface bg-primary text-on-primary transition-opacity ${
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
        <div className="flex-1 space-y-1 text-center md:text-left">
          {pictureError && <p className="font-body-sm text-body-sm text-error">{pictureError}</p>}
          <div className="flex flex-col items-center gap-sm md:flex-row">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {user.firstName} {user.lastName}
            </h2>
            <span className="flex items-center gap-xs rounded-full bg-surface-container-high px-sm py-0.5 font-label-lg text-label-lg text-on-surface-variant">
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-outline'}`} />
              {isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">{user.role.post}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-xl lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProfileCard />
        </div>
        <div className="lg:col-span-5">
          <SecurityCard />
        </div>
      </div>
    </>
  );
}

function ProfileCard() {
  const user = useAuthStore((s) => s.user)!;
  const updateMutation = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      whatsappNumber: user.whatsappNumber ?? '',
    },
  });

  const onSubmit = handleSubmit(
    (values) => {
      updateMutation.mutate(values);
    },
    () => toast.error('Veuillez corriger les erreurs du formulaire.'),
  );

  return (
    <div className="h-full rounded-xl border border-outline-variant bg-surface-container-lowest p-xl">
      <div className="mb-lg flex items-center gap-sm">
        <Icon name="person" className="text-primary" />
        <h3 className="font-title-lg text-title-lg text-on-surface">Informations personnelles</h3>
      </div>

      {updateMutation.isError && (
        <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(updateMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-lg" noValidate>
        <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
          <Input label="Prénom" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Nom" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
          <Input label="Téléphone" type="tel" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
          <Input
            label="WhatsApp"
            labelRight={<span className="font-body-sm text-body-sm text-on-surface-variant opacity-60">Optionnel</span>}
            type="tel"
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
        </div>

        <div className="grid grid-cols-1 gap-lg pt-md md:grid-cols-2">
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-md">
            <p className="mb-xs font-label-lg text-[11px] uppercase tracking-wider text-on-surface-variant">Email</p>
            <p className="font-body-md text-body-md font-medium text-on-surface">{user.email}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-md">
            <p className="mb-xs font-label-lg text-[11px] uppercase tracking-wider text-on-surface-variant">
              Membre depuis
            </p>
            <p className="font-body-md text-body-md font-medium text-on-surface">
              {formatMemberSince(user.createdAt)}
            </p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-md md:col-span-2">
            <p className="mb-xs font-label-lg text-[11px] uppercase tracking-wider text-on-surface-variant">Rôle</p>
            <p className="font-body-md text-body-md font-medium text-on-surface">{user.role.post}</p>
          </div>
        </div>

        <div className="flex justify-end pt-lg">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Icon name="progress_activity" className="animate-spin" /> : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SecurityCard() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const changePasswordMutation = useChangePasswordMutation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(
    (values) => {
      changePasswordMutation.mutate(
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        {
          onSuccess: () => {
            reset();
            // Le backend invalide la session côté serveur — on aligne l'état
            // local (store + cache API) et on renvoie vers le login, sans
            // repasser par /auth/logout (les tokens sont déjà révoqués).
            clear();
            navigate('/auth/login', { replace: true });
          },
        },
      );
    },
    () => toast.error('Veuillez corriger les erreurs du formulaire.'),
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-xl">
      <div className="mb-lg flex items-center gap-sm">
        <Icon name="security" className="text-primary" />
        <h3 className="font-title-lg text-title-lg text-on-surface">Sécurité</h3>
      </div>

      {changePasswordMutation.isError && (
        <div className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container">
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(changePasswordMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-1 flex-col" noValidate>
        <div className="flex-1 space-y-lg">
          <Input
            label="Mot de passe actuel"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.currentPassword?.message}
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent((v) => !v)}
                className="text-outline transition-colors hover:text-primary"
                aria-label={showCurrent ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name={showCurrent ? 'visibility_off' : 'visibility'} />
              </button>
            }
            {...register('currentPassword')}
          />

          <Input
            label="Nouveau mot de passe"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 caractères"
            error={errors.newPassword?.message}
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew((v) => !v)}
                className="text-outline transition-colors hover:text-primary"
                aria-label={showNew ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name={showNew ? 'visibility_off' : 'visibility'} />
              </button>
            }
            {...register('newPassword')}
          />

          <Input
            label="Confirmer le nouveau mot de passe"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="text-outline transition-colors hover:text-primary"
                aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name={showConfirm ? 'visibility_off' : 'visibility'} />
              </button>
            }
            {...register('confirmPassword')}
          />

          <div className="flex items-start gap-md rounded-lg border border-secondary-container bg-secondary-container/30 p-md">
            <Icon name="info" className="mt-0.5 text-secondary" />
            <p className="font-body-md text-body-md leading-relaxed text-on-secondary-container">
              Après avoir changé votre mot de passe, vous serez automatiquement déconnecté pour des raisons de
              sécurité.
            </p>
          </div>
        </div>

        <div className="pt-xl">
          <Button type="submit" variant="secondary" className="w-full" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              'Changer le mot de passe'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
