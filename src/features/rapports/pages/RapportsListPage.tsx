import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRapportsListQuery, useTelechargerRapportMutation } from '../api/rapports.queries';
import { ArchiverRapportDialog } from '../components/ArchiverRapportDialog';
import { RestaurerRapportDialog } from '../components/RestaurerRapportDialog';
import {
  MOIS_LABELS,
  RAPPORT_FILTER_ANNEE_MAX,
  RAPPORT_FILTER_ANNEE_MIN,
  RAPPORT_TYPE_LABELS,
} from '../lib/rapportDisplay';
import type { Rapport, RapportType } from '../types/rapport.types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { usePermission } from '@/shared/hooks/usePermission';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { Icon } from '@/shared/ui/Icon';

const ANNEES_FILTRE = Array.from(
  { length: RAPPORT_FILTER_ANNEE_MAX - RAPPORT_FILTER_ANNEE_MIN + 1 },
  (_, i) => RAPPORT_FILTER_ANNEE_MAX - i,
);

const FORMAT_ICONS: Record<string, string> = {
  PDF: 'picture_as_pdf',
  EXCEL: 'description',
  CSV: 'table_chart',
};

export function RapportsListPage() {
  const [type, setType] = useState<RapportType | ''>('');
  const [mois, setMois] = useState('');
  const [annee, setAnnee] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [archivingRapport, setArchivingRapport] = useState<Rapport | null>(null);
  const [restoringRapport, setRestoringRapport] = useState<Rapport | null>(null);

  const canCreate = usePermission('rapport:create');
  const canDelete = usePermission('rapport:delete');
  const canUpdate = usePermission('rapport:update');

  useEffect(() => {
    setPage(1);
  }, [type, mois, annee, includeArchived]);

  const { data, isLoading, isError, error } = useRapportsListQuery({
    type: type || undefined,
    mois: mois ? Number(mois) : undefined,
    annee: annee ? Number(annee) : undefined,
    includeArchived,
    page,
    limit: 10,
  });

  const rapports = data?.data ?? [];
  const meta = data?.meta;
  const rangeStart = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  function resetFilters() {
    setType('');
    setMois('');
    setAnnee('');
    setIncludeArchived(false);
  }

  function handleArchived() {
    setArchivingRapport(null);
  }

  function handleRestored() {
    setRestoringRapport(null);
  }

  return (
    <>
      <div className="mb-lg flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Rapports RH</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Historique des documents générés</p>
        </div>
        {canCreate ? (
          <Link to="/rapports/new">
            <Button>
              <Icon name="add_chart" />
              Générer un rapport
            </Button>
          </Link>
        ) : (
          <Button title="Permission rapport:create requise" disabled>
            <Icon name="add_chart" />
            Générer un rapport
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="mb-lg grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex flex-wrap items-end gap-md rounded-lg border border-outline-variant bg-surface-container-low p-md lg:col-span-10">
          <div className="min-w-[13rem] flex-1">
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
              Type de rapport
            </label>
            <Select className="w-full" value={type} onChange={(e) => setType(e.target.value as RapportType | '')}>
              <option value="">Tous les types</option>
              {(Object.keys(RAPPORT_TYPE_LABELS) as RapportType[]).map((t) => (
                <option key={t} value={t}>
                  {RAPPORT_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-32">
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Mois</label>
            <Select className="w-full" value={mois} onChange={(e) => setMois(e.target.value)}>
              <option value="">Tous les mois</option>
              {MOIS_LABELS.slice(1).map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-24">
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">Année</label>
            <Select className="w-full" value={annee} onChange={(e) => setAnnee(e.target.value)}>
              <option value="">Toutes</option>
              {ANNEES_FILTRE.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex h-10 cursor-pointer items-center gap-sm px-md">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="font-label-md text-label-md text-on-surface-variant">
              Inclure les rapports archivés
            </span>
          </label>
        </div>
        <div className="flex items-end lg:col-span-2">
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 w-full items-center justify-center gap-sm rounded-lg border border-outline text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <Icon name="filter_alt_off" className="text-[20px]" />
            <span className="font-label-md text-label-md">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-outline-variant bg-surface-container-high">
              <tr>
                <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Type
                </th>
                <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Période
                </th>
                <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Collaborateur
                </th>
                <th className="px-lg py-md text-center font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Format
                </th>
                <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Date de génération
                </th>
                <th className="px-lg py-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Statut
                </th>
                <th className="px-lg py-md text-right font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-lg py-md" colSpan={7}>
                      <div className="h-5 animate-pulse rounded bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td className="px-lg py-lg text-center font-body-sm text-body-sm text-error" colSpan={7}>
                    {getApiErrorMessage(error, 'Impossible de charger la liste des rapports.')}
                  </td>
                </tr>
              ) : rapports.length === 0 ? (
                <tr>
                  <td
                    className="px-lg py-lg text-center font-body-sm text-body-sm text-on-surface-variant"
                    colSpan={7}
                  >
                    Aucun rapport ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                rapports.map((rapport) => (
                  <RapportRow
                    key={rapport.id}
                    rapport={rapport}
                    canDelete={canDelete}
                    canUpdate={canUpdate}
                    onArchive={() => setArchivingRapport(rapport)}
                    onRestore={() => setRestoringRapport(rapport)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant p-md">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Affichage de {rangeStart}-{rangeEnd} sur {meta.total} rapports
            </span>
            <div className="flex items-center gap-md">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_left" />
              </button>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Page {meta.page} / {meta.pagesTotales}
              </span>
              <button
                type="button"
                disabled={page >= meta.pagesTotales}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-xs rounded p-sm font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ArchiverRapportDialog rapport={archivingRapport} onClose={() => setArchivingRapport(null)} onArchived={handleArchived} />
      <RestaurerRapportDialog rapport={restoringRapport} onClose={() => setRestoringRapport(null)} onRestored={handleRestored} />
    </>
  );
}

interface RapportRowProps {
  rapport: Rapport;
  canDelete: boolean;
  canUpdate: boolean;
  onArchive: () => void;
  onRestore: () => void;
}

function RapportRow({ rapport, canDelete, canUpdate, onArchive, onRestore }: RapportRowProps) {
  const telechargerMutation = useTelechargerRapportMutation();
  const canDownload = !!rapport.fichier;

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
    <tr className="transition-colors hover:bg-surface-container">
      <td className="px-lg py-md">
        <span className="rounded bg-primary-fixed px-2 py-1 font-label-md text-label-sm text-on-primary-fixed">
          {RAPPORT_TYPE_LABELS[rapport.type]}
        </span>
      </td>
      <td className="px-lg py-md font-label-md text-label-md text-on-surface">{rapport.periode}</td>
      <td className="px-lg py-md font-body-md text-body-md text-on-surface">
        {rapport.user ? `${rapport.user.firstName} ${rapport.user.lastName}` : 'Tous les collaborateurs'}
      </td>
      <td className="px-lg py-md text-center" title={rapport.formatExport}>
        <Icon
          name={FORMAT_ICONS[rapport.formatExport] ?? 'draft'}
          className={rapport.formatExport === 'PDF' ? 'text-error' : 'text-[#1D6F42]'}
        />
      </td>
      <td className="px-lg py-md font-label-md text-label-md text-on-surface-variant">
        {new Date(rapport.dateGeneration).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className="px-lg py-md">
        {rapport.estArchive ? (
          <span className="flex w-fit items-center gap-1 rounded-full bg-outline-variant px-2 py-0.5 font-label-md text-label-sm text-on-surface-variant">
            <span className="h-1 w-1 rounded-full bg-on-surface-variant" />
            Archivé
          </span>
        ) : (
          <span className="flex w-fit items-center gap-1 rounded-full bg-secondary-fixed px-2 py-0.5 font-label-md text-label-sm text-on-secondary-fixed-variant">
            <span className="h-1 w-1 rounded-full bg-on-secondary-fixed-variant" />
            Actif
          </span>
        )}
      </td>
      <td className="px-lg py-md text-right">
        <div className="flex items-center justify-end gap-xs">
          <Link
            to={`/rapports/${rapport.id}`}
            title="Voir"
            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
          >
            <Icon name="visibility" className="text-[20px]" />
          </Link>
          <button
            type="button"
            title={canDownload ? 'Télécharger' : 'Fichier non disponible'}
            disabled={!canDownload || telechargerMutation.isPending}
            onClick={handleDownload}
            className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon
              name={telechargerMutation.isPending ? 'progress_activity' : 'download'}
              className={`text-[20px] ${telechargerMutation.isPending ? 'animate-spin' : ''}`}
            />
          </button>
          {rapport.estArchive ? (
            <button
              type="button"
              title={canUpdate ? 'Restaurer' : 'Permission rapport:update requise'}
              disabled={!canUpdate}
              onClick={onRestore}
              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="unarchive" className="text-[20px]" />
            </button>
          ) : (
            <button
              type="button"
              title={canDelete ? 'Archiver' : 'Permission rapport:delete requise'}
              disabled={!canDelete}
              onClick={onArchive}
              className="rounded p-xs text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="archive" className="text-[20px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
