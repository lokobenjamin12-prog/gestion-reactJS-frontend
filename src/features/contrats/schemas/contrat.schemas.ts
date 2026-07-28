import { z } from 'zod';

// Tous les champs collent au type brut des <input>/<select> du formulaire
// (toujours des strings) — la conversion vers le payload attendu par le
// backend se fait dans toCreateContratPayload(), pas dans le schéma.
export const createContratSchema = z
  .object({
    userId: z.string().min(1, 'Veuillez sélectionner un collaborateur'),
    type: z.enum(['CDI', 'CDD'], { error: 'Veuillez choisir un type de contrat' }),
    dateDebut: z.string().min(1, 'La date de début est requise'),
    dateFin: z.string().optional(),
  })
  // Miroir exact de la règle backend : dateFin obligatoire pour un CDD, interdite pour un CDI.
  .refine((data) => data.type !== 'CDD' || !!data.dateFin, {
    message: 'La date de fin est obligatoire pour un CDD',
    path: ['dateFin'],
  });

export type CreateContratFormValues = z.infer<typeof createContratSchema>;

export interface CreateContratPayload {
  userId: string;
  type: 'CDI' | 'CDD';
  dateDebut: string;
  dateFin?: string;
}

export function toCreateContratPayload(values: CreateContratFormValues): CreateContratPayload {
  return {
    userId: values.userId,
    type: values.type,
    dateDebut: values.dateDebut,
    dateFin: values.type === 'CDD' ? values.dateFin : undefined,
  };
}

// PUT /contrats/:id (UpdateContratDto = PartialType(OmitType(CreateContratDto, ['userId','type','dateDebut'])))
// n'accepte en pratique que dateFin — le service rejette toute mise à jour
// d'un CDI et exige dateFin pour un CDD.
export const updateContratSchema = z.object({
  dateFin: z.string().min(1, 'La date de fin est requise'),
});

export type UpdateContratFormValues = z.infer<typeof updateContratSchema>;

export interface UpdateContratPayload {
  dateFin: string;
}

export function toUpdateContratPayload(values: UpdateContratFormValues): UpdateContratPayload {
  return { dateFin: values.dateFin };
}
