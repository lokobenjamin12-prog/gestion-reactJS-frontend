import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

export type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>;

export interface CreateDepartmentPayload {
  name: string;
}

export function toCreateDepartmentPayload(values: CreateDepartmentFormValues): CreateDepartmentPayload {
  return { name: values.name };
}

export const updateDepartmentSchema = createDepartmentSchema;

export type UpdateDepartmentFormValues = CreateDepartmentFormValues;

export interface UpdateDepartmentPayload {
  name: string;
}

export function toUpdateDepartmentPayload(values: UpdateDepartmentFormValues): UpdateDepartmentPayload {
  return { name: values.name };
}
