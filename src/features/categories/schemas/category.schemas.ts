import { z } from 'zod';

export const createCategorySchema = z.object({
  articleId: z.string().min(1, 'Veuillez sélectionner un article'),
  nomUnique: z.string().min(2, 'Le nom du format doit contenir au moins 2 caractères'),
  prixUnite: z.string().min(1, 'Le prix unitaire est requis'),
  description: z.string().optional(),
  seuilAlerte: z.string().optional(),
  seuilCritique: z.string().optional(),
});

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;

export interface CreateCategoryPayload {
  articleId: string;
  nomUnique: string;
  prixUnite: number;
  description?: string;
  seuilAlerte?: number;
  seuilCritique?: number;
}

export function toCreateCategoryPayload(values: CreateCategoryFormValues): CreateCategoryPayload {
  return {
    articleId: values.articleId,
    nomUnique: values.nomUnique,
    prixUnite: Number(values.prixUnite),
    description: values.description?.trim() || undefined,
    seuilAlerte: values.seuilAlerte ? Number(values.seuilAlerte) : undefined,
    seuilCritique: values.seuilCritique ? Number(values.seuilCritique) : undefined,
  };
}

// UpdateCategoryDto autorise techniquement de changer articleId/seuilAlerte/
// seuilCritique (PartialType(CreateCategoryDto)), mais UpdateCategoryResponseDto
// ne renvoie que { id, nomUnique, prixUnite, message, updatedAt } — et ces
// seuils vivent réellement au niveau de la ligne de stock, pas de la catégorie.
// On limite donc le formulaire d'édition à ce qui est confirmé applicable.
export const updateCategorySchema = z.object({
  nomUnique: z.string().min(2, 'Le nom du format doit contenir au moins 2 caractères'),
  prixUnite: z.string().min(1, 'Le prix unitaire est requis'),
  description: z.string().optional(),
});

export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;

export interface UpdateCategoryPayload {
  nomUnique: string;
  prixUnite: number;
  description?: string;
}

export function toUpdateCategoryPayload(values: UpdateCategoryFormValues): UpdateCategoryPayload {
  return {
    nomUnique: values.nomUnique,
    prixUnite: Number(values.prixUnite),
    description: values.description?.trim() || undefined,
  };
}
