import { z } from 'zod';

export const createArticleSchema = z.object({
  nom: z.string().min(3, "Le nom de l'article doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  nomUniqueCategory: z.string().min(1, 'Le nom du format est requis'),
  prixUnite: z.string().min(1, 'Le prix unitaire est requis'),
  seuilAlerte: z.string().optional(),
  seuilCritique: z.string().optional(),
});

export type CreateArticleFormValues = z.infer<typeof createArticleSchema>;

export interface CreateArticlePayload {
  nom: string;
  description?: string;
  nomUniqueCategory: string;
  prixUnite: number;
  seuilAlerte?: number;
  seuilCritique?: number;
}

export function toCreateArticlePayload(values: CreateArticleFormValues): CreateArticlePayload {
  return {
    nom: values.nom,
    description: values.description?.trim() || undefined,
    nomUniqueCategory: values.nomUniqueCategory,
    prixUnite: Number(values.prixUnite),
    seuilAlerte: values.seuilAlerte ? Number(values.seuilAlerte) : undefined,
    seuilCritique: values.seuilCritique ? Number(values.seuilCritique) : undefined,
  };
}

// UpdateArticleDto accepte aussi un champ `unite`, mais ArticleService.update()
// ne l'applique jamais (`data: { nom: nom ?? undefined }`) — on ne l'expose donc
// pas ici pour ne pas fabriquer un champ qui n'a aucun effet réel.
export const updateArticleSchema = z.object({
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

export type UpdateArticleFormValues = z.infer<typeof updateArticleSchema>;

export interface UpdateArticlePayload {
  nom: string;
}

export const createSimpleArticleSchema = z.object({
  nomArticle: z
    .string()
    .min(1, "Le nom de l'article est requis")
    .max(100, "Le nom de l'article est trop long (max 100 caractères)"),
});

export type CreateSimpleArticleFormValues = z.infer<typeof createSimpleArticleSchema>;

export interface CreateSimpleArticlePayload {
  nomArticle: string;
}
