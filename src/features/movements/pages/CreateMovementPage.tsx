import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateMovementMutation, useStockOverviewQuery } from '../api/movements.queries';
import { createMovementSchema, toCreateMovementPayload, type CreateMovementFormValues } from '../schemas/movement.schemas';
import { formatCurrency, getAlertBadgeClass, getMovementTypeBadgeClass } from '../lib/movementDisplay';
import type { MovementResult } from '../types/movement.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const TYPE_OPTIONS = [
  { value: 'ENTREE', label: 'ENTRÉE (Réception de marchandises)' },
  { value: 'SORTIE', label: 'SORTIE (Vente ou transfert)' },
  { value: 'AJUSTEMENT', label: 'AJUSTEMENT (Inventaire physique)' },
  { value: 'PERTE', label: 'PERTE (Casse ou péremption)' },
];

// Format attendu par <input type="datetime-local"> : "YYYY-MM-DDTHH:mm" en heure locale.
function nowForDateTimeLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function CreateMovementPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<MovementResult | null>(null);

  return (
    <div className="mx-auto max-w-[42rem]">
      <nav className="mb-lg flex items-center gap-xs font-label-sm text-label-sm text-outline">
        <span>Commerce</span>
        <span className="mx-1">/</span>
        <span>Stock</span>
        <span className="mx-1">/</span>
        <span className="font-bold text-primary">Enregistrer un mouvement</span>
      </nav>

      {result ? (
        <MovementConfirmation result={result} onReset={() => setResult(null)} />
      ) : (
        <MovementForm initialArticleStockId={searchParams.get('articleStockId') ?? ''} onCreated={setResult} />
      )}
    </div>
  );
}

interface MovementFormProps {
  initialArticleStockId: string;
  onCreated: (result: MovementResult) => void;
}

function MovementForm({ initialArticleStockId, onCreated }: MovementFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateMovementMutation();
  const { data: stocksData } = useStockOverviewQuery();
  const errorRef = useScrollToError(createMutation.isError);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateMovementFormValues>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      articleStockId: initialArticleStockId,
      type: 'ENTREE',
      movementDate: nowForDateTimeLocal(),
    },
  });

  const type = watch('type');

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(toCreateMovementPayload(values), {
      onSuccess: onCreated,
    });
  });

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl shadow-sm">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-[24px] text-on-surface">Nouveau mouvement de stock</h2>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          Saisissez les détails pour mettre à jour l'inventaire en temps réel.
        </p>
      </div>

      {createMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(createMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-lg" noValidate>
        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
            Article et format
          </label>
          <Select className="w-full" {...register('articleStockId')}>
            <option value="">Sélectionner un article et un format</option>
            {stocksData?.map((s) => (
              <option key={s.stockId} value={s.stockId}>
                {s.nomArticle} — {s.categoryNom} (stock actuel : {s.quantite})
              </option>
            ))}
          </Select>
          {errors.articleStockId && (
            <p className="mt-xs font-body-sm text-body-sm text-error">{errors.articleStockId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
            Type de mouvement
          </label>
          <Select className="w-full" {...register('type')}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {type === 'AJUSTEMENT' && (
            <div className="mt-sm flex items-start gap-sm rounded-lg border border-secondary-container bg-secondary-container/30 p-sm">
              <Icon name="info" className="text-[16px] text-secondary" />
              <p className="font-body-sm text-body-sm leading-tight text-secondary">
                Cette valeur remplacera la quantité actuelle (nouvelle quantité absolue, pas un ajout).
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
          <Input
            label="Quantité"
            type="number"
            min="1"
            placeholder="Ex: 50"
            error={errors.quantite?.message}
            {...register('quantite')}
          />
          <Input
            label="Date & heure"
            type="datetime-local"
            error={errors.movementDate?.message}
            {...register('movementDate')}
          />
        </div>

        <div>
          <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
            Motif / Commentaire <span className="italic text-outline">(recommandé pour un ajustement)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Détaillez la raison du mouvement..."
            className="w-full resize-none rounded-lg border border-outline-variant bg-white px-md py-sm font-body-md text-body-md outline-none focus:border-primary"
            {...register('motif')}
          />
        </div>

        <div className="flex items-center justify-end gap-md pt-md">
          <Button variant="outline" type="button" onClick={() => navigate('/mouvements-stock')}>
            Annuler
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              'Enregistrer le mouvement'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface MovementConfirmationProps {
  result: MovementResult;
  onReset: () => void;
}

function MovementConfirmation({ result, onReset }: MovementConfirmationProps) {
  const { movement, stock, alerte } = result;

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="flex items-center gap-md border-b border-outline-variant bg-emerald-50 p-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Icon name="check_circle" filled />
        </div>
        <div>
          <h3 className="font-title-md text-title-md text-emerald-800">Mouvement enregistré !</h3>
          <p className="font-body-md text-body-md text-emerald-700">
            {stock.nomArticle} — {stock.categorie}
          </p>
        </div>
      </div>

      <div className="space-y-lg p-xl">
        <div className="grid grid-cols-2 gap-gutter">
          <div className="rounded-lg border border-outline-variant bg-surface-container p-md text-center">
            <p className="mb-1 font-label-md text-label-md text-on-surface-variant">Stock précédent</p>
            <p className="font-headline-lg text-[24px] font-bold text-on-surface">{stock.quantiteAvant}</p>
          </div>
          <div className="rounded-lg border border-secondary-container bg-secondary-container/20 p-md text-center">
            <p className="mb-1 font-label-md text-label-md text-secondary">Nouveau stock</p>
            <p className="font-headline-lg text-[24px] font-bold text-primary">{stock.quantiteApres}</p>
          </div>
        </div>

        {alerte.active && (
          <div className="flex items-start gap-md rounded-lg border border-error-container bg-error-container/40 p-md">
            <Icon name="report" className="mt-0.5 text-error" />
            <div>
              <p className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-error-container">
                Alerte de niveau {alerte.niveau}
              </p>
              <p className="font-body-md text-body-md text-on-error-container">{alerte.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-sm border-t border-outline-variant pt-lg">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Type de mouvement</span>
            <span className={`rounded-full px-sm py-1 font-label-sm text-label-sm font-bold ${getMovementTypeBadgeClass(movement.type)}`}>
              {movement.type}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Valeur du stock (après)</span>
            <span className="font-label-md text-label-md text-on-surface">{formatCurrency(stock.valeurStock)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Niveau d'alerte</span>
            <span className={`rounded px-sm py-1 font-label-sm text-label-sm font-bold uppercase ${getAlertBadgeClass(stock.niveauApres)}`}>
              {stock.niveauApres}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">ID du mouvement</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{movement.id}</span>
          </div>
        </div>

        <div className="flex flex-col gap-sm pt-md">
          <Button className="w-full" onClick={onReset}>
            Enregistrer un autre mouvement
          </Button>
          <Link to="/mouvements-stock/historique" className="text-center">
            <Button variant="outline" className="w-full">
              Voir l'historique
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
