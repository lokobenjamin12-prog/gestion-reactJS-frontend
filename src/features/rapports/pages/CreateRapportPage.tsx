import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGenererRapportMutation,
  useTelechargerRapportMutation,
} from '../api/rapports.queries';
import { createRapportSchema, toCreateRapportPayload, type CreateRapportFormValues } from '../schemas/rapport.schemas';
import {
  formatPeriode,
  MOIS_LABELS,
  RAPPORT_ANNEE_MAX,
  RAPPORT_ANNEE_MIN,
  RAPPORT_TYPE_LABELS,
} from '../lib/rapportDisplay';
import type { GenerateRapportResult } from '../types/rapport.types';
import { useUsersQuery } from '@/features/users/api/users.queries';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { useScrollToError } from '@/shared/hooks/useScrollToError';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const ANNEES = Array.from(
  { length: RAPPORT_ANNEE_MAX - RAPPORT_ANNEE_MIN + 1 },
  (_, i) => RAPPORT_ANNEE_MIN + i,
);

export function CreateRapportPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<GenerateRapportResult | null>(null);

  return (
    <div className="mx-auto max-w-[42rem]">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Rapports RH</h2>
        <p className="mt-xs font-body-md text-on-surface-variant">
          Générez des analyses détaillées sur le capital humain de votre organisation.
        </p>
      </div>

      {result ? (
        <RapportGenerated result={result} onGenerateAnother={() => setResult(null)} />
      ) : (
        <RapportForm onGenerated={setResult} onCancel={() => navigate('/rapports')} />
      )}
    </div>
  );
}

interface RapportFormProps {
  onGenerated: (result: GenerateRapportResult) => void;
  onCancel: () => void;
}

function RapportForm({ onGenerated, onCancel }: RapportFormProps) {
  const generateMutation = useGenererRapportMutation();
  const { data: usersData } = useUsersQuery({ limit: 100 });
  const errorRef = useScrollToError(generateMutation.isError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRapportFormValues>({
    resolver: zodResolver(createRapportSchema),
    defaultValues: { formatExport: 'PDF' },
  });

  const onSubmit = handleSubmit((values) => {
    generateMutation.mutate(toCreateRapportPayload(values), {
      onSuccess: onGenerated,
    });
  });

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-xl">
      <div className="mb-xl flex items-center gap-md">
        <div className="rounded bg-primary-container p-sm">
          <Icon name="analytics" className="text-on-primary" />
        </div>
        <h3 className="font-title-md text-title-md">Générer un rapport</h3>
      </div>

      {generateMutation.isError && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container outline-none ring-error focus:ring-2"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(generateMutation.error)}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-lg" noValidate>
        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface-variant">
            TYPE DE RAPPORT <span className="text-error">*</span>
          </label>
          <Select className="w-full" defaultValue="" {...register('type')}>
            <option disabled value="">
              Sélectionnez un type de rapport
            </option>
            {(Object.keys(RAPPORT_TYPE_LABELS) as Array<keyof typeof RAPPORT_TYPE_LABELS>).map((type) => (
              <option key={type} value={type}>
                {RAPPORT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          {errors.type && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.type.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-gutter">
          <div className="space-y-xs">
            <label className="block font-label-md text-label-md text-on-surface-variant">MOIS</label>
            <Select className="w-full" defaultValue="" {...register('mois')}>
              <option value="">Tous les mois</option>
              {MOIS_LABELS.slice(1).map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-xs">
            <label className="block font-label-md text-label-md text-on-surface-variant">ANNÉE</label>
            <Select className="w-full" defaultValue="" {...register('annee')}>
              <option value="">Toutes les années</option>
              {ANNEES.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface-variant">COLLABORATEUR</label>
          <Select className="w-full" defaultValue="" {...register('userId')}>
            <option value="">Tous les collaborateurs</option>
            {usersData?.data.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-xs">
          <label className="block font-label-md text-label-md text-on-surface-variant">
            FORMAT D'EXPORT <span className="text-error">*</span>
          </label>
          <div className="mt-xs flex gap-lg">
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="radio" value="PDF" className="h-4 w-4 accent-primary" {...register('formatExport')} />
              <span className="font-body-md">PDF (.pdf)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="radio" value="EXCEL" className="h-4 w-4 accent-primary" {...register('formatExport')} />
              <span className="font-body-md">Excel (.xlsx)</span>
            </label>
          </div>
          {errors.formatExport && (
            <p className="mt-xs font-body-sm text-body-sm text-error">{errors.formatExport.message}</p>
          )}
        </div>

        <div className="flex items-start gap-sm rounded bg-surface-container p-md">
          <Icon name="info" className="text-[20px] text-secondary" />
          <p className="font-body-sm text-body-sm leading-relaxed text-on-secondary-fixed-variant">
            Un avertissement peut apparaître si les données du mois ne sont pas encore clôturées, mais le rapport
            sera généré quand même.
          </p>
        </div>

        <div className="flex items-center justify-end gap-lg border-t border-outline-variant pt-lg">
          <Button variant="outline" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="download" className="text-[18px]" />
                Générer
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

interface RapportGeneratedProps {
  result: GenerateRapportResult;
  onGenerateAnother: () => void;
}

function RapportGenerated({ result, onGenerateAnother }: RapportGeneratedProps) {
  const telechargerMutation = useTelechargerRapportMutation();
  const { rapport, avertissement } = result;

  function handleDownload() {
    telechargerMutation.mutate(rapport.id, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_${rapport.type.toLowerCase()}_${rapport.periode.replace('/', '-')}.${
          rapport.formatExport === 'PDF' ? 'pdf' : 'xlsx'
        }`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-xl">
      <div className="mb-lg flex items-center gap-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed">
          <Icon name="check_circle" className="text-on-tertiary-fixed-variant" />
        </div>
        <div>
          <h3 className="font-title-md text-title-md text-on-surface">Rapport généré avec succès</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {RAPPORT_TYPE_LABELS[rapport.type]} — {formatPeriode(rapport.mois, rapport.annee)}
          </p>
        </div>
      </div>

      {avertissement && (
        <div className="mb-lg flex items-start gap-md rounded-lg border border-tertiary-fixed bg-tertiary-fixed/30 p-md text-on-tertiary-fixed-variant">
          <Icon name="warning" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{avertissement}</p>
        </div>
      )}

      {telechargerMutation.isError && (
        <div
          role="alert"
          className="mb-lg flex items-start gap-md rounded-lg border border-error/20 bg-error-container p-md text-on-error-container"
        >
          <Icon name="error" className="mt-0.5 text-[20px]" />
          <p className="font-body-sm text-body-sm">{getApiErrorMessage(telechargerMutation.error)}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-lg border-t border-outline-variant pt-lg">
        <Link to="/rapports" className="font-label-md text-label-md text-primary hover:underline">
          Retour à l'historique
        </Link>
        <div className="flex items-center gap-lg">
          <Button variant="outline" type="button" onClick={onGenerateAnother}>
            Générer un autre rapport
          </Button>
          <Button type="button" onClick={handleDownload} disabled={telechargerMutation.isPending}>
            {telechargerMutation.isPending ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              <>
                <Icon name="download" className="text-[18px]" />
                Télécharger
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
