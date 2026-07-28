import { z } from 'zod';
import { passwordSchema } from '@/features/auth/schemas/auth.schemas';

// Tous les champs collent au type brut des <input>/<select> du formulaire
// (toujours des strings, y compris pour les nombres) — la conversion vers les
// types attendus par le backend (roleId/salaireBase/quotaCongesAnnuel en
// number) se fait explicitement dans toCreateUserPayload(), pas dans le
// schéma. Ça évite les soucis de typage entre zodResolver et react-hook-form
// quand on mélange z.coerce/z.preprocess avec des champs optionnels.
export const createUserSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phoneNumber: z.string().min(1, 'Le téléphone est requis'),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  roleId: z.string().min(1, 'Veuillez sélectionner un rôle'),
  dateNaissance: z.string().optional(),
  dateRecrutement: z.string().optional(),
  adresse: z.string().optional(),
  salaireBase: z.string().optional(),
  typeHoraire: z.enum(['JOUR', 'NUIT', 'MIXTE']),
  quotaCongesAnnuel: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email: string;
  password: string;
  roleId: number;
  dateNaissance?: string;
  dateRecrutement?: string;
  adresse?: string;
  salaireBase?: number;
  typeHoraire: 'JOUR' | 'NUIT' | 'MIXTE';
  quotaCongesAnnuel?: number;
}

/** Convertit les valeurs brutes du formulaire (tout en string) vers le payload attendu par POST /auth/register. */
export function toCreateUserPayload(values: CreateUserFormValues): CreateUserPayload {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    phoneNumber: values.phoneNumber,
    whatsappNumber: values.whatsappNumber || undefined,
    email: values.email,
    password: values.password,
    roleId: Number(values.roleId),
    dateNaissance: values.dateNaissance || undefined,
    dateRecrutement: values.dateRecrutement || undefined,
    adresse: values.adresse || undefined,
    salaireBase: values.salaireBase ? Number(values.salaireBase) : undefined,
    typeHoraire: values.typeHoraire,
    quotaCongesAnnuel: values.quotaCongesAnnuel ? Number(values.quotaCongesAnnuel) : undefined,
  };
}

// Même principe que createUserSchema, mais sans email/password : PATCH /users/:id
// n'accepte jamais ces deux champs (email figé, mot de passe uniquement via le
// flux reset-password) — cf. BACKEND_CONTEXT.md.
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phoneNumber: z.string().min(1, 'Le téléphone est requis'),
  whatsappNumber: z.string().optional(),
  roleId: z.string().min(1, 'Veuillez sélectionner un rôle'),
  dateNaissance: z.string().optional(),
  dateRecrutement: z.string().optional(),
  adresse: z.string().optional(),
  salaireBase: z.string().optional(),
  typeHoraire: z.enum(['JOUR', 'NUIT', 'MIXTE']),
  quotaCongesAnnuel: z.string().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  roleId: number;
  dateNaissance?: string;
  dateRecrutement?: string;
  adresse?: string;
  salaireBase?: number;
  typeHoraire: 'JOUR' | 'NUIT' | 'MIXTE';
  quotaCongesAnnuel?: number;
}

export function toUpdateUserPayload(values: UpdateUserFormValues): UpdateUserPayload {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    phoneNumber: values.phoneNumber,
    whatsappNumber: values.whatsappNumber || undefined,
    roleId: Number(values.roleId),
    dateNaissance: values.dateNaissance || undefined,
    dateRecrutement: values.dateRecrutement || undefined,
    adresse: values.adresse || undefined,
    salaireBase: values.salaireBase ? Number(values.salaireBase) : undefined,
    typeHoraire: values.typeHoraire,
    quotaCongesAnnuel: values.quotaCongesAnnuel ? Number(values.quotaCongesAnnuel) : undefined,
  };
}
