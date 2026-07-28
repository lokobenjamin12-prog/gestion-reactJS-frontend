import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateUserMutation } from '../api/users.queries';
import { useRolesQuery } from '@/features/roles/api/roles.queries';
import { createUserSchema, toCreateUserPayload, type CreateUserFormValues } from '../schemas/user.schemas';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import { Icon } from '@/shared/ui/Icon';

export function CreateUserPage() {
  const navigate = useNavigate();
  const createUserMutation = useCreateUserMutation();
  const { data: rolesData } = useRolesQuery();
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useScrollToError(createUserMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { typeHoraire: 'JOUR' },
  });

  const onSubmit = handleSubmit((values) => {
    createUserMutation.mutate(toCreateUserPayload(values), {
      onSuccess: (data) => navigate(`/users/${data.user.id}`, { replace: true }),
    });
  });

  return (
    <>
      <div className="mb-xl">
        <nav className="mb-sm flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
          <Link to="/users" className="hover:text-primary">
            Utilisateurs
          </Link>
          <Icon name="chevron_right" className="text-[16px]" />
          <span className="font-bold text-primary">Nouveau collaborateur</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-primary">Créer un utilisateur</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Remplissez les informations pour enregistrer un nouveau membre du personnel dans le système Ndolecam.
        </p>
      </div>

      {createUserMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(createUserMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-lg md:grid-cols-12" noValidate>
        {/* Informations d'identité */}
        <div className="flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-8">
          <div className="flex items-center gap-sm border-b border-outline-variant pb-sm">
            <Icon name="person" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Informations d'identité</h3>
          </div>
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            <Input label="Prénom" placeholder="Ex: Jean" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Nom" placeholder="Ex: Dupont" error={errors.lastName?.message} {...register('lastName')} />
            <Input
              label="Date de naissance (Optionnel)"
              type="date"
              error={errors.dateNaissance?.message}
              {...register('dateNaissance')}
            />
            <div>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Rôle</label>
              <Select className="w-full" {...register('roleId')}>
                <option value="">Sélectionner un rôle</option>
                {rolesData?.data.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nomRole}
                  </option>
                ))}
              </Select>
              {errors.roleId && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.roleId.message}</p>}
            </div>
          </div>
          <Textarea
            label="Adresse (Optionnel)"
            placeholder="Numéro de rue, quartier, ville..."
            rows={2}
            error={errors.adresse?.message}
            {...register('adresse')}
          />
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-4">
          <div className="flex items-center gap-sm border-b border-outline-variant pb-sm">
            <Icon name="contact_phone" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Contact</h3>
          </div>
          <Input
            label="Téléphone"
            type="tel"
            placeholder="+237 ..."
            error={errors.phoneNumber?.message}
            {...register('phoneNumber')}
          />
          <Input
            label="WhatsApp (Optionnel)"
            type="tel"
            placeholder="+237 ..."
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
        </div>

        {/* Compte & Sécurité */}
        <div className="flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-6">
          <div className="flex items-center gap-sm border-b border-outline-variant pb-sm">
            <Icon name="security" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Compte & sécurité</h3>
          </div>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            trailing={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="text-outline transition-colors hover:text-primary"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            }
            {...register('password')}
          />
        </div>

        {/* Administratif */}
        <div className="flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-low p-lg md:col-span-6">
          <div className="flex items-center gap-sm border-b border-outline-variant pb-sm">
            <Icon name="work" className="text-primary" />
            <h3 className="font-title-md text-title-md text-on-surface">Administratif</h3>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <Input
              label="Date recrutement (Optionnel)"
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
            <div>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                Salaire de base (Optionnel)
              </label>
              <div className="flex">
                <input
                  type="number"
                  placeholder="0"
                  className="flex-1 rounded-l-lg border border-outline-variant bg-white px-md py-sm font-body-md text-on-surface outline-none focus:border-primary"
                  {...register('salaireBase')}
                />
                <span className="flex items-center rounded-r-lg border border-l-0 border-outline-variant bg-surface-container px-md py-sm font-label-md text-label-md text-on-surface-variant">
                  FCFA
                </span>
              </div>
              {errors.salaireBase && (
                <p className="mt-xs font-body-sm text-body-sm text-error">{errors.salaireBase.message}</p>
              )}
            </div>
            <Input
              label="Congés (Annuel, Optionnel)"
              type="number"
              placeholder="30"
              error={errors.quotaCongesAnnuel?.message}
              {...register('quotaCongesAnnuel')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-md flex justify-end gap-md border-t border-outline-variant pt-lg md:col-span-12">
          <Link to="/users">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="person_add" />
                Créer l'utilisateur
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
