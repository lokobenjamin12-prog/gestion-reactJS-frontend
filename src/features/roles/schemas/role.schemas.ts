import { z } from 'zod';

export const createRoleSchema = z.object({
  post: z.string().min(1, 'Le titre du poste est requis'),
  departmentId: z.string().min(1, 'Veuillez sélectionner un département'),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

export interface CreateRolePayload {
  post: string;
  departmentId: number;
  permissionIds: number[];
}

export function toCreateRolePayload(values: CreateRoleFormValues, permissionIds: number[]): CreateRolePayload {
  return {
    post: values.post,
    departmentId: Number(values.departmentId),
    permissionIds,
  };
}

// PATCH /roles/:id accepte un DTO partiel (PartialType(CreateRoleDto)), mais
// le formulaire d'édition redemande toujours poste + département + permissions
// en entier — permissionIds remplace systématiquement la liste complète côté
// backend (deleteMany + create), donc on l'envoie toujours au submit.
export const updateRoleSchema = createRoleSchema;

export type UpdateRoleFormValues = CreateRoleFormValues;

export interface UpdateRolePayload {
  post: string;
  departmentId: number;
  permissionIds: number[];
}

export function toUpdateRolePayload(values: UpdateRoleFormValues, permissionIds: number[]): UpdateRolePayload {
  return {
    post: values.post,
    departmentId: Number(values.departmentId),
    permissionIds,
  };
}
