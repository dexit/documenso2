import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type { ColumnDef } from '@tanstack/react-table';
import { useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { trpc } from '@documenso/trpc/react';
import type { TApiTokenRow } from '@documenso/trpc/server/admin-router/find-api-tokens.types';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { Input } from '@documenso/ui/primitives/input';

export function AdminApiTokensTable() {
  const { _, i18n } = useLingui();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const page = Number(searchParams.get('atp')) || 1;
  const perPage = Number(searchParams.get('atpp')) || 25;
  const query = searchParams.get('atq') || '';

  const [localQuery, setLocalQuery] = useState(query);

  const { data, isLoading } = trpc.admin.apiToken.find.useQuery({
    page,
    perPage,
    query: query || undefined,
  });

  const columns = useMemo<ColumnDef<TApiTokenRow>[]>(
    () => [
      {
        header: _(msg`Name`),
        accessorKey: 'name',
        cell: ({ row }) => <span className="font-medium text-sm">{row.original.name}</span>,
      },
      {
        header: _(msg`Algorithm`),
        accessorKey: 'algorithm',
        cell: ({ row }) => <Badge variant="neutral" className="text-xs">{row.original.algorithm}</Badge>,
      },
      {
        header: _(msg`Status`),
        accessorKey: 'isExpired',
        cell: ({ row }) =>
          row.original.isExpired ? (
            <Badge variant="destructive" className="text-xs"><Trans>Expired</Trans></Badge>
          ) : (
            <Badge variant="default" className="text-xs"><Trans>Active</Trans></Badge>
          ),
      },
      {
        header: _(msg`Team`),
        accessorKey: 'teamName',
        cell: ({ row }) => row.original.teamName ?? <span className="text-muted-foreground text-xs"><Trans>—</Trans></span>,
      },
      {
        header: _(msg`Owner`),
        accessorKey: 'userEmail',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium">{row.original.userName}</p>
            <p className="text-muted-foreground">{row.original.userEmail}</p>
          </div>
        ),
      },
      {
        header: _(msg`Created`),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {i18n.date(row.original.createdAt, { dateStyle: 'short' })}
          </span>
        ),
      },
      {
        header: _(msg`Expires`),
        accessorKey: 'expires',
        cell: ({ row }) =>
          row.original.expires ? (
            <span className={`text-xs ${row.original.isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              {i18n.date(row.original.expires, { dateStyle: 'short' })}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground"><Trans>Never</Trans></span>
          ),
      },
    ],
    [_, i18n],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={_(msg`Search name, owner, or team...`)}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateSearchParams({ atq: localQuery || null, atp: '1' });
          }}
          className="h-8 w-64 text-sm"
        />
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => updateSearchParams({ atq: localQuery || null, atp: '1' })}
        >
          <Trans>Search</Trans>
        </Button>
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setLocalQuery('');
              updateSearchParams({ atq: null, atp: '1' });
            }}
          >
            <Trans>Clear</Trans>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        perPage={perPage}
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        onPaginationChange={(p, pp) => updateSearchParams({ atp: String(p), atpp: String(pp) })}
        error={{ enable: false }}
        skeleton={{ enable: isLoading, rows: 5 }}
      />
    </div>
  );
}
