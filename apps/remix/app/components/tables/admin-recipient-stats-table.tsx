import { useMemo } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DateTime } from 'luxon';
import { Link, useSearchParams } from 'react-router';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import type { DataTableColumnDef } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Input } from '@documenso/ui/primitives/input';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';

export const AdminRecipientStatsTable = () => {
  const { _, i18n } = useLingui();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));
  const recipientQuery = searchParams?.get('rq') ?? '';

  const debouncedQuery = useDebouncedValue(recipientQuery, 400);

  const { data, isLoading, isLoadingError } = trpc.admin.recipient.findStats.useQuery(
    {
      query: debouncedQuery || undefined,
      page: parsedParams.page,
      perPage: parsedParams.perPage ?? 50,
    },
    { placeholderData: (prev) => prev },
  );

  const results = data ?? {
    data: [],
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  };

  const columns = useMemo(() => {
    return [
      {
        header: _(msg`Recipient`),
        accessorKey: 'email',
        cell: ({ row }) => (
          <div>
            {row.original.name && (
              <p className="font-medium">{row.original.name}</p>
            )}
            <p className="text-sm text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        header: _(msg`Total`),
        accessorKey: 'totalDocuments',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.totalDocuments}</Badge>
        ),
      },
      {
        header: _(msg`Completed`),
        accessorKey: 'completedDocuments',
        cell: ({ row }) => (
          <Badge className="bg-green-600 text-white">{row.original.completedDocuments}</Badge>
        ),
      },
      {
        header: _(msg`Pending`),
        accessorKey: 'pendingDocuments',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.pendingDocuments}</Badge>
        ),
      },
      {
        header: _(msg`Rejected`),
        accessorKey: 'rejectedDocuments',
        cell: ({ row }) => (
          row.original.rejectedDocuments > 0 ? (
            <Badge variant="destructive">{row.original.rejectedDocuments}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        ),
      },
      {
        header: _(msg`Last Activity`),
        accessorKey: 'lastActivity',
        cell: ({ row }) =>
          row.original.lastActivity ? (
            <span className="text-sm text-muted-foreground">
              {i18n.date(row.original.lastActivity, DateTime.DATE_MED)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        header: '',
        id: 'actions',
        cell: ({ row }) => (
          <Link
            to={`/admin/activity-logs?email=${encodeURIComponent(row.original.email)}`}
            className="text-sm text-primary hover:underline"
          >
            <Trans>View activity</Trans>
          </Link>
        ),
      },
    ] satisfies DataTableColumnDef<(typeof results)['data'][number]>[];
  }, [_, i18n]);

  return (
    <div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder={_(msg`Search by name or email...`)}
          value={recipientQuery}
          onChange={(e) =>
            updateSearchParams({ rq: e.target.value || undefined, page: 1 })
          }
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={(page, perPage) => updateSearchParams({ page, perPage })}
        error={{ enable: isLoadingError }}
        skeleton={{
          enable: isLoading,
          rows: 5,
          component: (
            <>
              <TableCell><Skeleton className="h-8 w-32 rounded" /></TableCell>
              <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
            </>
          ),
        }}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>
    </div>
  );
};
