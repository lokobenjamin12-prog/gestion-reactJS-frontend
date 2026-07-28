import { z } from 'zod';
import type { MouvementType } from '../types/movement.types';

export const createMovementSchema = z.object({
  articleStockId: z.string().min(1, 'Veuillez sélectionner un article et un format'),
  type: z.string().min(1, 'Veuillez sélectionner un type de mouvement'),
  quantite: z.string().min(1, 'La quantité est requise'),
  motif: z.string().optional(),
  movementDate: z.string().min(1, 'La date du mouvement est requise'),
});

export type CreateMovementFormValues = z.infer<typeof createMovementSchema>;

export interface CreateMovementPayload {
  articleStockId: string;
  type: MouvementType;
  quantite: number;
  motif?: string;
  movementDate: string;
}

export function toCreateMovementPayload(values: CreateMovementFormValues): CreateMovementPayload {
  return {
    articleStockId: values.articleStockId,
    type: values.type as MouvementType,
    quantite: Number(values.quantite),
    motif: values.motif?.trim() || undefined,
    movementDate: new Date(values.movementDate).toISOString(),
  };
}
