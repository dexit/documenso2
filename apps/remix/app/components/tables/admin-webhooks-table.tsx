import { useMemo } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { CheckCircle2Icon, ExternalLinkIcon, XCircleIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';

export const AdminWebhooksTable = () => {
  const { _, i18n } = useLingui();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));
  const webhookQuery = searchParams?.get('wq') ?? '';
  const statusFilter = searchParams?.get('status') ?? 'all';

  const debouncedQuery = useDebouncedValue(webhookQuery, 400);

  const enabledFilter =
    statusFilter === 'enabled' ? true : statusFilter === 'disabled' ? false : undefined;

  const { data, isLoading, isLoadingError } = trpc.admin.webhook.find.useQuery(
    {
      query: debouncedQuery || undefined,
      enabled: enabledFilter,
      page: parsedParams.page,
      perPage: parsedParams.perPage ?? 20,
    },
    { placeholderData: (prev) => prev },
  );

  const results = data ?? { data: [], perPage: 20, currentPage: 1, totalPages: 1 };

  const columns = useMemo(() => {
    return [
      {
        header: _(msg`Endpoint`),
        accessorKey: 'webhookUrl',
        cell: ({ row }) => (
          <div className="max-w-xs">
            <a
              href={row.original.webhookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-xs hover:underline"
            >
              <span className="truncate">{row.original.webhookUrl}</span>
              <ExternalLinkIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
            </a>
          </div>
        ),
      },
      {
        header: _(msg`Status`),
        accessorKey: 'enabled',
        cell: ({ row }) =>
          row.original.enabled ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2Icon className="h-3 w-3" />
              <Trans>Enabled</Trans>
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircleIcon className="h-3 w-3" />
              <Trans>Disabled</Trans>
            </Badge>
          ),
      },
      {
        header: _(msg`Team`),
        cell: ({ row }) => (
          <Link
            to={`/admin/teams/${row.original.team.id}`}
            className="font-medium hover:underline"
          >
            {row.original.team.name}
          </Link>
        ),
      },
      {
        header: _(msg`Owner`),
        cell: ({ row }) => (
          <Link
            to={`/admin/users/${row.original.user.id}`}
            className="text-sm hover:underline"
          >
            {row.original.user.name ?? row.original.user.email}
          </Link>
        ),
      },
      {
        header: _(msg`Events`),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.eventTriggers.length}
          </span>
        ),
      },
      {
        header: _(msg`Calls`),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original._count.webhookCalls}</span>
        ),
      },
      {
        header: _(msg`Last call`),
        cell: ({ row }) => {
          if (!row.original.lastCallAt) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="space-y-0.5">
              <div>
                {row.original.lastCallStatus === 'SUCCESS' ? (
                  <Badge variant="default" className="text-xs">
                    <Trans>OK</Trans>
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <Trans>Failed</Trans>
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {i18n.date(row.original.lastCallAt)}
              </div>
            </div>
          );
        },
      },
      {
        header: _(msg`Created`),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {i18n.date(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/admin/logs/webhooks?webhookId=${row.original.id}`}
            className="text-xs text-primary hover:underline"
          >
            <Trans>View logs</Trans>
          </Link>
        ),
      },
    ] satisfies DataTableColumnDef<(typeof results)['data'][number]>[];
  }, [_, i18n]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder={_(msg`Search by URL...`)}
          value={webhookQuery}
          onChange={(e) => updateSearchParams({ wq: e.target.value || undefined, page: 1 })}
          className="max-w-xs"
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => updateSearchParams({ status: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={_(msg`Status`)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <Trans>All</Trans>
            </SelectItem>
            <SelectItem value="enabled">
              <Trans>Enabled</Trans>
            </SelectItem>
            <SelectItem value="disabled">
              <Trans>Disabled</Trans>
            </SelectItem>
          </SelectContent>
        </Select>
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
              <TableCell><Skeleton className="h-4 w-48 rounded" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-12 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16 rounded" /></TableCell>
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
