import { z } from 'zod';
import type { RapportType } from '../types/rapport.types';

export const createRapportSchema = z.object({
  type: z.string().min(1, 'Le type de rapport est requis'),
  mois: z.string().optional(),
  annee: z.string().optional(),
  userId: z.string().optional(),
  formatExport: z.string().min(1, "Le format d'export est requis"),
});

export type CreateRapportFormValues = z.infer<typeof createRapportSchema>;

export interface CreateRapportPayload {
  type: RapportType;
  mois?: number;
  annee?: number;
  userId?: string;
  formatExport: 'PDF' | 'EXCEL';
}

export function toCreateRapportPayload(values: CreateRapportFormValues): CreateRapportPayload {
  return {
    type: values.type as RapportType,
    mois: values.mois ? Number(values.mois) : undefined,
    annee: values.annee ? Number(values.annee) : undefined,
    userId: values.userId || undefined,
    formatExport: values.formatExport as 'PDF' | 'EXCEL',
  };
}
