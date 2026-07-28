import { z } from 'zod';

export const openSessionSchema = z.object({
  commercialId: z.string().min(1, 'Veuillez sélectionner un commercial'),
  articleStockId: z.string().min(1, 'Veuillez sélectionner un article et un format'),
  quantiteDepart: z.string().min(1, 'La quantité de départ est requise'),
  jourOuverture: z.string().optional(),
  heureDepart: z.string().optional(),
});

export type OpenSessionFormValues = z.infer<typeof openSessionSchema>;

export interface OpenSessionPayload {
  commercialId: string;
  articleStockId: string;
  quantiteDepart: number;
  jourOuverture?: string;
  heureDepart?: string;
}

export function toOpenSessionPayload(values: OpenSessionFormValues): OpenSessionPayload {
  return {
    commercialId: values.commercialId,
    articleStockId: values.articleStockId,
    quantiteDepart: Number(values.quantiteDepart),
    jourOuverture: values.jourOuverture || undefined,
    heureDepart: values.heureDepart || undefined,
  };
}

const depenseRowSchema = z
  .object({
    montant: z.string(),
    motif: z.string(),
  })
  .refine((row) => row.montant.trim() !== '' === (row.motif.trim() !== ''), {
    message: 'Montant et motif doivent être renseignés ensemble',
    path: ['motif'],
  });

export function createCloseSessionSchema(quantiteDepart: number) {
  return z.object({
    quantiteRetour: z
      .string()
      .min(1, 'La quantité retournée est requise')
      .refine((v) => Number(v) >= 0, 'La quantité ne peut pas être négative')
      .refine((v) => Number(v) <= quantiteDepart, `La quantité retournée ne peut pas dépasser ${quantiteDepart}`),
    heureRetour: z.string().optional(),
    depenses: z.array(depenseRowSchema),
  });
}

export type CloseSessionFormValues = z.infer<ReturnType<typeof createCloseSessionSchema>>;

export interface CloseSessionPayload {
  quantiteRetour: number;
  heureRetour?: string;
  depenses: { montant: number; motif: string }[];
}

export function toCloseSessionPayload(values: CloseSessionFormValues): CloseSessionPayload {
  return {
    quantiteRetour: Number(values.quantiteRetour),
    heureRetour: values.heureRetour || undefined,
    depenses: values.depenses
      .filter((d) => d.montant.trim() !== '' && d.motif.trim() !== '')
      .map((d) => ({ montant: Number(d.montant), motif: d.motif.trim() })),
  };
}
