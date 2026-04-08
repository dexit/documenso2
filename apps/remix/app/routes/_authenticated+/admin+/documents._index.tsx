import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { ChevronDownIcon, ChevronUpIcon, Loader } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { extractInitials } from '@documenso/lib/utils/recipient-formatter';
import { trpc } from '@documenso/trpc/react';
import { Avatar, AvatarFallback } from '@documenso/ui/primitives/avatar';
import { Badge } from '@documenso/ui/primitives/badge';
import type { DataTableColumnDef } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Input } from '@documenso/ui/primitives/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@documenso/ui/primitives/tooltip';

import { DocumentStatus } from '~/components/general/document/document-status';

const STATUS_OPTIONS = ['', 'DRAFT', 'PENDING', 'COMPLETED', 'REJECTED'] as const;

function SortButton({
  column,
  label,
  currentCol,
  currentDir,
  onSort,
}: {
  column: string;
  label: string;
  currentCol: string;
  currentDir: string;
  onSort: (col: string) => void;
}) {
  const active = currentCol === column;
  return (
    <button
      className="flex items-center gap-1 text-left font-medium hover:text-foreground"
      onClick={() => onSort(column)}
    >
      {label}
      {active ? (
        currentDir === 'asc' ? (
          <ChevronUpIcon className="h-3 w-3" />
        ) : (
          <ChevronDownIcon className="h-3 w-3" />
        )
      ) : (
        <ChevronDownIcon className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export default function AdminDocumentsPage() {
  const { _, i18n } = useLingui();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [term, setTerm] = useState(() => searchParams.get('term') ?? '');
  const debouncedTerm = useDebouncedValue(term, 500);

  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 20;
  const status = (searchParams.get('status') ?? '') as 'DRAFT' | 'PENDING' | 'COMPLETED' | 'REJECTED' | '';
  const orderBy = (searchParams.get('orderBy') ?? 'createdAt') as 'createdAt' | 'updatedAt' | 'title';
  const orderByDirection = (searchParams.get('dir') ?? 'desc') as 'asc' | 'desc';

  const { data: findDocumentsData, isPending: isFindDocumentsLoading } =
    trpc.admin.document.find.useQuery(
      {
        query: debouncedTerm,
        page,
        perPage,
        status: status || undefined,
        orderBy,
        orderByDirection,
      },
      { placeholderData: (prev) => prev },
    );

  const results = findDocumentsData ?? { data: [], perPage: 20, currentPage: 1, totalPages: 1 };

  const handleSort = (col: string) => {
    if (col === orderBy) {
      updateSearchParams({ dir: orderByDirection === 'asc' ? 'desc' : 'asc', page: 1 });
    } else {
      updateSearchParams({ orderBy: col, dir: 'desc', page: 1 });
    }
  };

  const columns = useMemo(() => {
    return [
      {
        header: () => (
          <SortButton column="createdAt" label={_(msg`Created`)} currentCol={orderBy} currentDir={orderByDirection} onSort={handleSort} />
        ),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {i18n.date(row.original.createdAt, { dateStyle: 'short' })}
          </span>
        ),
      },
      {
        header: () => (
          <SortButton column="title" label={_(msg`Title`)} currentCol={orderBy} currentDir={orderByDirection} onSort={handleSort} />
        ),
        accessorKey: 'title',
        cell: ({ row }) => (
          <Link
            to={`/admin/documents/${row.original.envelopeId}`}
            className="block max-w-[12rem] truncate font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        header: _(msg`Status`),
        accessorKey: 'status',
        cell: ({ row }) => <DocumentStatus status={row.original.status} />,
      },
      {
        header: _(msg`Recipients`),
        accessorKey: 'recipients',
        cell: ({ row }) => {
          const total = row.original.recipients.length;
          const signed = row.original.recipients.filter((r: { signingStatus: string }) => r.signingStatus === 'SIGNED').length;
          return (
            <span className="text-sm tabular-nums">
              {signed}/{total}
            </span>
          );
        },
      },
      {
        header: _(msg`Team`),
        accessorKey: 'team',
        cell: ({ row }) => {
          const team = row.original.team as { name?: string; url?: string } | null;
          return team ? (
            <Badge variant="neutral" className="text-xs">{(team as { name?: string }).name ?? team.url}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      },
      {
        header: _(msg`Owner`),
        accessorKey: 'owner',
        cell: ({ row }) => {
          const fallback = row.original.user.name
            ? extractInitials(row.original.user.name)
            : row.original.user.email.slice(0, 1).toUpperCase();
          return (
            <Tooltip delayDuration={200}>
              <TooltipTrigger>
                <Link to={`/admin/users/${row.original.user.id}`}>
                  <Avatar className="dark:border-border h-9 w-9 border-2 border-solid border-white">
                    <AvatarFallback className="text-muted-foreground text-xs">{fallback}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="text-sm">
                <p className="font-medium">{row.original.user.name}</p>
                <p className="text-muted-foreground">{row.original.user.email}</p>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        header: () => (
          <SortButton column="updatedAt" label={_(msg`Updated`)} currentCol={orderBy} currentDir={orderByDirection} onSort={handleSort} />
        ),
        accessorKey: 'updatedAt',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {i18n.date(row.original.updatedAt, { dateStyle: 'short' })}
          </span>
        ),
      },
    ] satisfies DataTableColumnDef<(typeof results)['data'][number]>[];
  }, [_, i18n, orderBy, orderByDirection]);

  return (
    <div>
      <h2 className="text-4xl font-semibold">
        <Trans>Manage documents</Trans>
      </h2>

      <div className="mt-8 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="search"
            placeholder={_(msg`Search title, ID, or envelope_...`)}
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              updateSearchParams({ page: 1 });
            }}
            className="h-9 w-72"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => updateSearchParams({ status: e.target.value || null, page: 1 })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === '' ? _(msg`All statuses`) : s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {(status || debouncedTerm) && (
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setTerm('');
                updateSearchParams({ status: null, term: null, page: 1 });
              }}
            >
              <Trans>Clear filters</Trans>
            </button>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {findDocumentsData ? (
              <Trans>{findDocumentsData.count} documents</Trans>
            ) : null}
          </span>
        </div>

        {/* Table */}
        <div className="relative">
          <DataTable
            columns={columns}
            data={results.data}
            perPage={results.perPage ?? 20}
            currentPage={results.currentPage ?? 1}
            totalPages={results.totalPages ?? 1}
            onPaginationChange={(newPage, newPerPage) =>
              updateSearchParams({ page: newPage, perPage: newPerPage })
            }
          >
            {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
          </DataTable>

          {isFindDocumentsLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/30">
              <Loader className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
